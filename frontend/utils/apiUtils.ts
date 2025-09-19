export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export class ApiError extends Error {
  public status: number;
  public response?: Response;

  constructor(message: string, status: number, response?: Response) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.response = response;
  }
}

/**
 * Safe JSON parsing with proper error handling
 */
export const safeJsonParse = async (response: Response): Promise<any> => {
  const contentType = response.headers.get("content-type");

  // Check if response is actually JSON
  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text();
    console.error(
      "Expected JSON but received:",
      contentType,
      text.substring(0, 200)
    );
    throw new ApiError(
      `Server returned ${
        contentType || "unknown content type"
      } instead of JSON`,
      response.status,
      response
    );
  }

  try {
    return await response.json();
  } catch (error) {
    const text = await response.clone().text();
    console.error("JSON parse error. Response text:", text.substring(0, 200));
    throw new ApiError(
      "Invalid JSON response from server",
      response.status,
      response
    );
  }
};

export const safeFetch = async <T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    // Set default headers
    const defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    // Log response details for debugging
    console.log(`API Request: ${options.method || "GET"} ${url}`);
    console.log(`Response Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get("content-type")}`);

    // Handle different status codes
    if (response.status >= 200 && response.status < 300) {
      // Success response
      try {
        const data = await safeJsonParse(response);
        return { success: true, data, status: response.status };
      } catch (parseError) {
        return {
          success: false,
          error:
            parseError instanceof ApiError
              ? parseError.message
              : "Failed to parse response",
          status: response.status,
        };
      }
    } else {
      // Error response
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorData = await safeJsonParse(response);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If error response is not JSON, try to get text
        try {
          const errorText = await response.text();
          if (errorText && !errorText.includes("<!DOCTYPE")) {
            errorMessage = errorText;
          }
        } catch {
          // Use default error message
        }
      }

      return {
        success: false,
        error: errorMessage,
        status: response.status,
      };
    }
  } catch (error) {
    console.error("Network error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error occurred",
      status: 0,
    };
  }
};
