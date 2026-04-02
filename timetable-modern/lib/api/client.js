const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

export async function request(method, path, body) {
  const url = `${BASE_URL}${path}`;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const isJson = response.headers
      .get("content-type")
      ?.includes("application/json");
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      throw {
        status: response.status,
        error: data?.error || "REQUEST_FAILED",
        message: data?.message || "Request failed",
      };
    }

    return data;
  } catch (err) {
    if (err?.status) {
      throw err;
    }

    throw {
      status: 0,
      error: "NETWORK_ERROR",
      message:
        "Cannot reach server. Check if backend is running at localhost:3000",
    };
  }
}
