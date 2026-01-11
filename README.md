# 🏃‍♀️ RunBuddy – A Mobile App for Beginner Runners

Acting as a virtual personal trainer, RunBuddy helps beginner runners take their first steps and reach their goals, starting with 5 km and progressing to 10 km. With training plans, GPS tracking, and personalized suggestions, the app encourages users to make running a regular part of their daily routine.

## 🛠 Tech Stack

- **React Native** – Cross-platform mobile development  
- **Expo** – Framework and tooling for React Native  
- **.NET** – Backend API  
- **Entity Framework** – Database ORM  
- **SQLite** – Local data storage  
- **ML.NET** – Personalized training recommendations  

## ✨ Key Features

### Beginner-Friendly Training Plans
- Couch to 5K program  
- Personalized progression toward 10K  

### Guided Running
- Run/walk intervals  
- Voice guidance  
- Real-time GPS-based distance, pace, and time tracking  

### Statistics & Insights
- Weekly, monthly and yearly summaries  
- Detailed run history  

### Community Features
- Friends and activity feed  
- Weekly challenges 

## 📱 Application Screens

---

### Welcome & Authentication

<table align="center">
  <tr>
    <td><img src="./screenshots/welcome.png" height="380"/></td>
    <td><img src="./screenshots/register1.png" height="380"/></td>
    <td><img src="./screenshots/register2.png" height="380"/></td>
    <td><img src="./screenshots/login.png" height="380"/></td>
  </tr>
</table>

- Motivational welcome screen introducing the application  
- Multi-step user registration  
- Secure user login  

---

### Home

<table align="center">
  <tr>
    <td><img src="./screenshots/home.png" height="420"/></td>
  </tr>
</table>

- Weekly statistics overview  
- Next recommended training session  
- Weather information based on user location (OpenMeteo API)  

---

### Plans

<table align="center">
  <tr>
    <td><img src="./screenshots/plans.png" height="420"/></td>
  </tr>
</table>

- Full training plan overview (organized by weeks and sessions)  
- Completed trainings visually highlighted  
- Detailed information for upcoming runs  

---

### Run Mode Selection

- Choice between **plan-based run** and **free run**

<table align="center">
  <tr>
    <td><img src="./screenshots/dailyrun.png" height="380"/></td>
    <td><img src="./screenshots/predictedrun.png" height="380"/></td>
    <td><img src="./screenshots/freerun.jpg" height="380"/></td>
  </tr>
</table>

#### Training Plan–Based Run (5K Plan)
- Displays the current scheduled training session  
- Warm-up, run, and walk intervals  
- Visual progress indicator  
- Target distance and duration  

#### Predicted Run (10K Plan)
- Distance recommendation based on previous training sessions  
- Performance-based progression using machine learning  

#### Free Run
- Manual start of an unstructured run  
- No predefined distance or intervals  

---

### Active Run

<table align="center">
  <tr>
    <td><img src="./screenshots/run.gif" height="380"/></td>
  </tr>
</table>

- Display of remaining time and distance  
- Real-time GPS tracking  
- Current pace monitoring  
- Automatic run/walk voice guidance  

---

### Run Summary

<table align="center">
  <tr>
    <td><img src="./screenshots/runsummary.jpg" height="420"/></td>
  </tr>
</table>

- Distance, time, average pace, and calories burned  
- GPS-based route map  
- Run quality rating  
- Notes and photo attachments  

---

### Statistics

<table align="center">
  <tr>
    <td><img src="./screenshots/statistics.jpg" height="380"/></td>
  </tr>
</table>

- Aggregated running data  
- Weekly and monthly summaries  
- Detailed run history  

---

### Run Details

<table align="center">
  <tr>
    <td><img src="./screenshots/rundetails1.jpeg" height="380"/></td>
    <td><img src="./screenshots/rundetails2.jpeg" height="380"/></td>
  </tr>
</table>

- Full run data overview  
- Detailed route visualization with start and end markers  
- Pace breakdown  
- Notes, photos, and user rating  

---

### Community
<table align="center">
  <tr>
    <td><img src="./screenshots/statistics
</table>
- Activity feed with shared runs  
- Like and comment interactions  
      ### Challenges
- Weekly and monthly challenges  
- Head-to-head challenges with friends  
