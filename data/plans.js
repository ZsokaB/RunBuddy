const Plan = [
  {
    week: 1,
    days: [
      {
        day: 1,
        description:
          "Brisk 5-minute warm-up walk. Then alternate 60 seconds of jogging and 90 seconds of walking for a total of 20 minutes. Finish with a 5-minute cool down.",
        duration: 1800,
        workoutGoal: "Build endurance through alternating jogging and walking.",
        routine: [
          { activity: "Warm-up", duration: 300 },
          { activity: "Run", duration: 60 },
          { activity: "Walk", duration: 90 },
          { activity: "Run", duration: 60 },
          { activity: "Walk", duration: 90 },
          { activity: "Run", duration: 60 },
          { activity: "Walk", duration: 90 },
          { activity: "Run", duration: 60 },
          { activity: "Walk", duration: 90 },
          { activity: "Run", duration: 60 },
          { activity: "Walk", duration: 90 },
          { activity: "Run", duration: 60 },
          { activity: "Walk", duration: 90 },
          { activity: "Cool-down", duration: 300 },
        ],
        done: true,
      },
      {
        day: 2,
        description:
          "Brisk 5-minute warm-up walk. Then alternate 60 seconds of jogging and 90 seconds of walking for a total of 20 minutes. Finish with a 5-minute cool down.",
        duration: 11,

        workoutGoal: "Build endurance through alternating jogging and walking.",
        routine: [
          { activity: "Warm-up", duration: 1 },
          { activity: "Run", duration: 2 },
          { activity: "Walk", duration: 2 },
          { activity: "Run", duration: 2 },
          { activity: "Walk", duration: 2 },
          { activity: "Cool-down", duration: 2 },
        ],
        done: false,
      },
      {
        day: 3,
        description:
          "Brisk 5-minute warm-up walk. Then alternate 60 seconds of jogging and 90 seconds of walking for a total of 20 minutes. Finish with a 5-minute cool down.",
        duration: 1800,
        workoutGoal: "Build endurance through alternating jogging and walking.",
        routine: [
          { activity: "Warm-up", duration: 300 },
          { activity: "Run", duration: 60 },
          { activity: "Walk", duration: 90 },
          { activity: "Run", duration: 60 },
          { activity: "Walk", duration: 90 },
          { activity: "Run", duration: 60 },
          { activity: "Walk", duration: 90 },
          { activity: "Run", duration: 60 },
          { activity: "Walk", duration: 90 },
          { activity: "Cool-down", duration: 300 },
        ],
        done: false,
      },
    ],
  },
  {
    week: 2,
    days: [
      {
        day: 1,
        description:
          "Brisk 5-minute warm-up walk. Then alternate 90 seconds of jogging and 2 minutes of walking for a total of 20 minutes. Finish with a 5-minute cool down.",
        duration: 1800,
        workoutGoal: "Increase jogging intervals and build endurance.",
        routine: [
          { activity: "Warm-up", duration: 300 },
          { activity: "Run", duration: 90 },
          { activity: "Walk", duration: 120 },
          { activity: "Run", duration: 90 },
          { activity: "Walk", duration: 120 },
          { activity: "Run", duration: 90 },
          { activity: "Walk", duration: 120 },
          { activity: "Run", duration: 90 },
          { activity: "Walk", duration: 120 },
          { activity: "Cool-down", duration: 300 },
        ],
        done: false,
      },
      {
        day: 2,
        description:
          "Brisk 5-minute warm-up walk. Then alternate 90 seconds of jogging and 2 minutes of walking for a total of 20 minutes. Finish with a 5-minute cool down.",
        duration: 1800,
        workoutGoal: "Increase jogging intervals and build endurance.",
        routine: [
          { activity: "Warm-up", duration: 300 },
          { activity: "Run", duration: 90 },
          { activity: "Walk", duration: 120 },
          { activity: "Run", duration: 90 },
          { activity: "Walk", duration: 80 },
          { activity: "Run", duration: 90 },
          { activity: "Walk", duration: 120 },
          { activity: "Run", duration: 60},
          { activity: "Walk", duration: 80 },
          { activity: "Cool-down", duration: 300 },
        ],
        done: false,
      },
      {
        day: 3,
        description:
          "Brisk 5-minute warm-up walk. Then alternate 90 seconds of jogging and 2 minutes of walking for a total of 20 minutes. Finish with a 5-minute cool down.",
        duration: 1800,
        workoutGoal: "Increase jogging intervals and build endurance.",
        routine: [
          { activity: "Warm-up", duration: 300 },
          { activity: "Run", duration: 90 },
          { activity: "Walk", duration: 120 },
          { activity: "Run", duration: 90 },
          { activity: "Walk", duration: 120 },
          { activity: "Run", duration: 90 },
          { activity: "Walk", duration: 120 },
          { activity: "Run", duration: 90 },
          { activity: "Walk", duration: 120 },
          { activity: "Cool-down", duration: 300 },
        ],
        done: false,
      },
    ],
  },
  {
    week: 3,
    days: [
      {
        day: 1,
        description:
          "Brisk 5-minute warm-up walk. Then alternate 90 seconds of jogging and 2 minutes of walking for a total of 25 minutes. Finish with a 5-minute cool down.",
        duration: 2100,
        durationInSeconds: 2100,
        workoutGoal: "Increase total workout duration and endurance.",
        routine: [
          { activity: "Warm-up", duration: 300 },
          { activity: "Run", duration: 90 },
          { activity: "Walk", duration: 120 },
          { activity: "Run", duration: 90 },
          { activity: "Walk", duration: 120 },
          { activity: "Run", duration: 90 },
          { activity: "Walk", duration: 120 },
          { activity: "Run", duration: 90 },
          { activity: "Walk", duration: 120 },
          { activity: "Cool-down", duration: 300 },
        ],
        done: false,
      },
      {
        day: 2,
        description:
          "Brisk 5-minute warm-up walk. Then alternate 90 seconds of jogging and 2 minutes of walking for a total of 25 minutes. Finish with a 5-minute cool down.",
        duration: 2100,
        workoutGoal: "Increase total workout duration and endurance.",
        routine: [
          { activity: "Warm-up", duration: 300 },
          { activity: "Run", duration: 90 },
          { activity: "Walk", duration: 120 },
          { activity: "Run", duration: 90 },
          { activity: "Walk", duration: 120 },
          { activity: "Run", duration: 90 },
          { activity: "Walk", duration: 120 },
          { activity: "Run", duration: 90 },
          { activity: "Walk", duration: 120 },
          { activity: "Run", duration: 90 },
          { activity: "Walk", duration: 120 },
          { activity: "Run", duration: 90 },

          { activity: "Cool-down", duration: 300 },
        ],
        done: false,
      },
      {
        day: 3,
        description:
          "Brisk 5-minute warm-up walk. Then alternate 90 seconds of jogging and 2 minutes of walking for a total of 25 minutes. Finish with a 5-minute cool down.",
        duration: 2100,
        workoutGoal: "Increase total workout duration and endurance.",
        routine: [
          { activity: "Warm-up", duration: 300 },
          { activity: "Run", duration: 90 },
          { activity: "Walk", duration: 120 },
          { activity: "Run", duration: 90 },
          { activity: "Walk", duration: 120 },
          { activity: "Run", duration: 90 },
          { activity: "Walk", duration: 120 },
          { activity: "Run", duration: 90 },
          { activity: "Walk", duration: 120 },
          { activity: "Cool-down", duration: 300 },
        ],
        done: false,
      },
    ],
  },
];

 

export default Plan;
