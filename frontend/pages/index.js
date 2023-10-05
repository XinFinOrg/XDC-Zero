import { useAccount } from "wagmi";

export default function Home() {
  const address = useAccount();

  return (
    <>
      <div className="card shadow-2xl w-[1000px] m-auto mt-8">
        <div className="card-body">
          <div className="font-black">Local ChainId : {1000} </div>
          <div className="font-black">Local Enpoint : {"0x..."}</div>
          <div className="card-actions justify-end">
            <label className="btn btn-success w-max btn-sm">
              Register a Chain
            </label>
          </div>

          <div className="divider"></div>
          <div className="card shadow-2xl">
            <div className="card-body">
              <div className="font-black">Remote ChainId : {2}</div>
              <div className="font-black">Local CSC : {"0x..."}</div>
              <div className="font-black">Remote Enpoint : {"0x..."}</div>
              <div className="card-actions justify-end">
                <label className="btn btn-warning w-max btn-sm">
                  Configration
                </label>
              </div>
            </div>
          </div>
          <div className="card shadow-2xl">
            <div className="card-body">
              <div className="font-black">Remote ChainId : {13}</div>
              <div className="font-black">Local CSC : {"0x..."}</div>
              <div className="font-black">Remote Enpoint : {"0x..."}</div>
              <div className="card-actions justify-end">
                <label className="btn btn-warning w-max btn-sm">
                  Configration
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
