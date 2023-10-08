import { useAccount, useChainId, useContractReads } from "wagmi";
import { endpointMapping } from "../config";
import endpointABI from "../abi/endpointABI.json";
import WriteButton from "@/components/WriteButton";
import { useEffect, useState } from "react";
export default function Home() {
  const [rerender, setRerender] = useState(0);
  const [data, setData] = useState({});
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  const address = useAccount();

  const chainId = useChainId();

  const endpoint = endpointMapping[chainId].address;

  const endpointContract = {
    address: endpoint,
    abi: endpointABI,
  };

  const { data: reads0 } = useContractReads({
    contracts: [
      { ...endpointContract, functionName: "getChainId" },
      { ...endpointContract, functionName: "getChainKeys" },
    ],
    scopeKey: rerender,
  });

  const eChainId = reads0?.[0]?.result;

  const eChainKeys = reads0?.[1]?.result;

  const { data: reads1 } = useContractReads({
    contracts: eChainKeys?.map((key) => {
      return { ...endpointContract, functionName: "getChain", args: [key] };
    }),
  });

  const eChains = reads1?.map((read) => {
    return read.result;
  });

  const registerChain = {
    buttonName: "Register a Chain",
    data: {
      ...endpointContract,
      functionName: "registerChain",
      args: [data["chainId"], data["csc"], data["endpoint"]],
    },
    callback: (confirmed) => {
      if (confirmed) {
        setData({});
        setRerender(rerender + 1);
      }
    },
  };

  return (
    isClient && (
      <>
        <div className="card shadow-2xl w-[1000px] m-auto mt-8">
          <div className="card-body">
            <div className="font-black">
              Local ChainId : {eChainId?.toString() || "Not Set"}
            </div>
            <div className="font-black">
              Local Enpoint : {endpoint || "Not Set"}
            </div>
            <div className="card-actions justify-end">
              <label
                className="btn btn-success w-max btn-sm"
                htmlFor="registerChain"
              >
                Register a Chain
              </label>
            </div>

            <div className="divider"></div>
            {eChainKeys?.map((key, index) => {
              return (
                <div className="card shadow-2xl">
                  <div className="card-body">
                    <div className="font-black">
                      Remote ChainId : {key?.toString()}
                    </div>
                    <div className="font-black">
                      Local CSC : {eChains?.[index].csc}
                    </div>
                    <div className="font-black">
                      Remote Enpoint : {eChains?.[index].endpoint}
                    </div>
                    <div className="card-actions justify-end">
                      <label className="btn btn-warning w-max btn-sm">
                        Send Message
                      </label>
                      <label className="btn btn-warning w-max btn-sm">
                        Configration
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Put this part before </body> tag */}
        <input type="checkbox" id="registerChain" className="modal-toggle" />
        <div className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Register a Chain</h3>
            <p className="py-4">This modal works with a hidden checkbox!</p>
            <div className="grid gap-2">
              <input
                type="number"
                placeholder="send chain id"
                className="input w-full max-w-xs input-bordered"
                onChange={(e) => {
                  setData({ ...data, chainId: e.target.value });
                }}
              />
              <input
                type="text"
                placeholder="receive chain csc address"
                className="input w-full max-w-xs input-bordered"
                onChange={(e) => {
                  setData({ ...data, csc: e.target.value });
                }}
              />
              <input
                type="text"
                placeholder="send chain endpoint address"
                className="input w-full max-w-xs input-bordered"
                onChange={(e) => {
                  setData({ ...data, endpoint: e.target.value });
                }}
              />
            </div>
            <div className="modal-action">
              <WriteButton {...registerChain} />
              <label htmlFor="registerChain" className="btn">
                Close!
              </label>
            </div>
          </div>
        </div>
      </>
    )
  );
}
