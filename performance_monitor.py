#!/usr/bin/env python3
"""
Performance monitoring utilities for the Face Attendance API
"""

import time
import psutil
import os
from functools import wraps
from flask import request, g
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def monitor_performance(func):
    """
    Decorator to monitor function performance
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        start_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
        
        try:
            result = func(*args, **kwargs)
            return result
        finally:
            end_time = time.time()
            end_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
            
            execution_time = end_time - start_time
            memory_used = end_memory - start_memory
            
            logger.info(f"Function {func.__name__} - Time: {execution_time:.3f}s, Memory: {memory_used:.2f}MB")
            
            # Store performance data in Flask g object
            if not hasattr(g, 'performance_data'):
                g.performance_data = {}
            g.performance_data[func.__name__] = {
                'execution_time': execution_time,
                'memory_used': memory_used
            }
    
    return wrapper

def get_system_stats():
    """
    Get current system statistics
    """
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return {
            'cpu_percent': cpu_percent,
            'memory_total': memory.total / 1024 / 1024,  # MB
            'memory_available': memory.available / 1024 / 1024,  # MB
            'memory_percent': memory.percent,
            'disk_total': disk.total / 1024 / 1024 / 1024,  # GB
            'disk_free': disk.free / 1024 / 1024 / 1024,  # GB
            'disk_percent': (disk.used / disk.total) * 100
        }
    except Exception as e:
        logger.error(f"Error getting system stats: {e}")
        return {}

def log_request_performance():
    """
    Log request performance data
    """
    if hasattr(g, 'performance_data'):
        total_time = sum(data['execution_time'] for data in g.performance_data.values())
        total_memory = sum(data['memory_used'] for data in g.performance_data.values())
        
        logger.info(f"Request {request.endpoint} - Total Time: {total_time:.3f}s, Total Memory: {total_memory:.2f}MB")
        
        # Log individual function performance
        for func_name, data in g.performance_data.items():
            logger.info(f"  {func_name}: {data['execution_time']:.3f}s, {data['memory_used']:.2f}MB")

def check_performance_thresholds():
    """
    Check if performance is within acceptable thresholds
    """
    stats = get_system_stats()
    
    warnings = []
    
    if stats.get('cpu_percent', 0) > 80:
        warnings.append(f"High CPU usage: {stats['cpu_percent']:.1f}%")
    
    if stats.get('memory_percent', 0) > 85:
        warnings.append(f"High memory usage: {stats['memory_percent']:.1f}%")
    
    if stats.get('disk_percent', 0) > 90:
        warnings.append(f"High disk usage: {stats['disk_percent']:.1f}%")
    
    if warnings:
        logger.warning("Performance warnings: " + ", ".join(warnings))
    
    return warnings

def optimize_memory():
    """
    Attempt to optimize memory usage
    """
    try:
        import gc
        gc.collect()
        logger.info("Memory optimization completed")
    except Exception as e:
        logger.error(f"Memory optimization failed: {e}")

# Performance monitoring middleware
def performance_middleware(app):
    """
    Add performance monitoring middleware to Flask app
    """
    @app.before_request
    def before_request():
        g.start_time = time.time()
        g.start_memory = psutil.Process().memory_info().rss / 1024 / 1024
    
    @app.after_request
    def after_request(response):
        if hasattr(g, 'start_time'):
            end_time = time.time()
            end_memory = psutil.Process().memory_info().rss / 1024 / 1024
            
            request_time = end_time - g.start_time
            memory_used = end_memory - g.start_memory
            
            # Add performance headers
            response.headers['X-Request-Time'] = f"{request_time:.3f}s"
            response.headers['X-Memory-Used'] = f"{memory_used:.2f}MB"
            
            # Log slow requests
            if request_time > 5.0:  # 5 seconds threshold
                logger.warning(f"Slow request: {request.endpoint} took {request_time:.3f}s")
        
        return response
