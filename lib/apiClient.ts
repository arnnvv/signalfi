const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL!;

interface CommandPayload {
  command: "follow" | "withdraw";
  signature: string;
  address: string;
}

export async function postCommand(
  payload: CommandPayload,
): Promise<{ status: string }> {
  try {
    const response = await fetch(`${backendApiUrl}/api/command`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Backend API request failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Error in postCommand:", error);
    throw error;
  }
}
