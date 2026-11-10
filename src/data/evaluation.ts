export type EvaluationObjective = {
  id: string;
  label: string;
  body: string;
};

export const evaluationObjectives: EvaluationObjective[] = [
  {
    id: "spiritual",
    label: "Spiritual",
    body: "For the evaluation of the courses in the various programs, we identify those courses dealing with the student's personal Christian life as having the aim of developing the student spiritually. The assigning of prayer partners, Evangelism Week, staff-student retreats, and the Missions Conference are further parts of the program to assist students in this spiritual growth. These fall into the ontological domain of the personal being of a person in ministry.",
  },
  {
    id: "balance",
    label: "Theory & Practice",
    body: "Training at CBTS focuses on helping students maintain a healthy balance between theory and practice by building strong ties between matter taught and the contextual realities. This helps the student to better minister relevantly in diverse contexts.",
  },
  {
    id: "intellectual",
    label: "Intellectual",
    body: "The development of the student intellectually is seen to consist not only of those courses focused on the Scriptures, Christian Doctrines, and the History of the Church, but also to include those general education courses which support and aid the student in relating these to the world in which s/he lives.",
  },
  {
    id: "vocational",
    label: "Vocational",
    body: "We see the vocational development of the program as being mainly those courses that deal with relating the background gained in the other areas of study to the work of the Christian minister in his/her community. Whereas, intellectually, he may learn Biblical truths, in his vocational development he learns to present these truths to his congregation.",
  },
];
