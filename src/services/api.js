const API_BASE = 'https://task.moraspirit.com';

export async function getMembers() {
  const response = await fetch(`${API_BASE}/api/members`);
  if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
  const data = await response.json();
  return data.members || [];
}

export async function checkAvailability(memberId, date) {
  const response = await fetch(`${API_BASE}/api/availability/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      msp_id: memberId, // Map member.id to msp_id expected by the backend
      date: date,
    }),
  });

  if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
  return await response.json();
}