import type { Metadata } from "next";
import { ContactClient } from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the WAQAR team. We respond to every enquiry personally.",
};

export default function ContactPage() {
  return <ContactClient />;
}
