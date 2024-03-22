import History from "../History";

export default function Page({ params }: { params: { address: string } }) {
  return <History address={params.address} />;
}
