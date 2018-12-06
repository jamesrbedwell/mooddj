module.exports = {
  getTimeOfDay() {
    let currentHour = new Date().getHours()
    if (currentHour > 3 && currentHour < 12) {
      return "morning"
    } else if (currentHour < 17) {
      return "afternoon"
    } else {
      return "night"
    }
  }
}
