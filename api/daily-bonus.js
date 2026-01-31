// Simple serverless function to simulate a daily check-in
// In a real app, this would check a database for the user's last claim time.

export default function handler(req, res) {
  // Mock logic: Always return a random small bonus for demo purposes
  // In production, you'd validate a session token here.
  
  const randomBonus = Math.floor(Math.random() * 500) + 100;
  
  res.status(200).json({
    message: "Bonus claimed",
    bonus: randomBonus,
    timestamp: Date.now()
  });
}