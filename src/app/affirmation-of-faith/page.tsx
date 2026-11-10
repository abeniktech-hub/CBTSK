import type { Metadata } from "next";
import AffirmationPageContent from "./AffirmationPageContent";

export const metadata: Metadata = {
  title: { absolute: "Affirmation of Faith | CBTS" },
  description:
    "Read the Cameroon Baptist Theological Seminary Affirmation of Faith, including its eleven articles on Scripture, God, salvation, the church, and Christian life.",
};

export default function AffirmationOfFaithPage() {
  return <AffirmationPageContent />;
}
