import { useAccount } from "wagmi";

export default function Home() {
  const address = useAccount();

  return (
    <>
      <div className="card shadow-2xl w-[1000px] m-auto mt-20">
        <div className="card-body">
          <div className="font-black">Enpoint :{} </div>
          <div className="divider"></div>
          <div className="card shadow-2xl">
            <div className="card-body">
              <div className="font-black">Enpoint :{}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
