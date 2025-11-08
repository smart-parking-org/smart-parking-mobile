export const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 11) {
    return { text: "buổi sáng", icon: "🌤️" };
  }
  if (hour >= 11 && hour < 14) {
    return { text: "buổi trưa", icon: "☀️" };
  }
  if (hour >= 14 && hour < 18) {
    return { text: "buổi chiều", icon: "🌇" };
  }
  return { text: "buổi tối", icon: "🌜" };
};
