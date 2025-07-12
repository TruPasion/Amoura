export async function getnearbyhelper(payload: any) {
  let nearbyUsers = null;

  try {
    const response = await fetch("/api/gis/getnearbyusers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch nearby users");
    }

    nearbyUsers = await response.json();
  } catch (error) {
    console.error("Error fetching nearby users:", error);
  }

  return nearbyUsers;
}
