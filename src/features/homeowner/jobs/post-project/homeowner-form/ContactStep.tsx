import { AddressContactCard } from "@/features/homeowner/jobs/post-project/AddressContactCard";

export interface ContactStepProps {
  postalCode: string;
  setPostalCode: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  cityAutoFilled: boolean;
  setCityAutoFilled: (v: boolean) => void;
}

export function ContactStep(props: ContactStepProps) {
  return <AddressContactCard {...props} />;
}
