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

  const endpoint = endpointMapping[chainId]?.address;

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
    scopeKey: rerender,
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

  const editChain = {
    buttonName: "Edit Chain",
    data: {
      ...endpointContract,
      functionName: "editChain",
      args: [data["editChainId"], data["editCsc"], data["editEndpoint"]],
    },
    callback: (confirmed) => {
      if (confirmed) {
        setData({});
        setRerender(rerender + 1);
      }
    },
  };

  console.log(data);

  const send = {
    buttonName: "Send",
    data: {
      ...endpointContract,
      functionName: "send",
      args: [data["rid"], data["rua"], data["data"]],
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
        <div className="card shadow-2xl lg:w-[1000px] m-auto mt-8 whitespace-normal break-words">
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
                      <label
                        className="btn btn-warning w-max btn-sm"
                        htmlFor="crossChainCall"
                        onClick={() => {
                          setData({ ...data, rid: key?.toString() });
                        }}
                      >
                        Cross Chain Call
                      </label>
                      <label
                        className="btn btn-warning w-max btn-sm"
                        onClick={(e) => {
                          setData({
                            ...data,
                            editChainId: key,
                          });
                        }}
                        htmlFor="configration"
                      >
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
            <p className="py-4">Please submit your chain specifics</p>
            <div className="grid gap-2">
              <input
                type="number"
                placeholder="send chain id"
                className="input w-full max-w-xs input-bordered"
                value={data["chainId"]}
                onChange={(e) => {
                  setData({ ...data, chainId: e.target.value });
                }}
              />
              <input
                type="text"
                placeholder="receive chain csc address"
                className="input w-full max-w-xs input-bordered"
                value={data["csc"]}
                onChange={(e) => {
                  setData({ ...data, csc: e.target.value });
                }}
              />
              <input
                type="text"
                placeholder="send chain endpoint address"
                className="input w-full max-w-xs input-bordered"
                value={data["endpoint"]}
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

        <input type="checkbox" id="configration" className="modal-toggle" />
        <div className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Edit Chain</h3>
            <p className="py-4">Please submit your chain specifics</p>
            <div className="grid gap-2">
              <input
                type="number"
                placeholder={data["editChainId"]}
                className="input w-full max-w-xs input-bordered"
                disabled={true}
              />
              <input
                type="text"
                placeholder="receive chain csc address"
                className="input w-full max-w-xs input-bordered"
                value={data["editCsc"]}
                onChange={(e) => {
                  setData({ ...data, editCsc: e.target.value });
                }}
              />
              <input
                type="text"
                placeholder="send chain endpoint address"
                className="input w-full max-w-xs input-bordered"
                value={data["editEndpoint"]}
                onChange={(e) => {
                  setData({ ...data, editEndpoint: e.target.value });
                }}
              />
            </div>
            <div className="modal-action">
              <WriteButton {...editChain} />
              <label htmlFor="configration" className="btn">
                Close!
              </label>
            </div>
          </div>
        </div>

        <input type="checkbox" id="crossChainCall" className="modal-toggle" />
        <div className="modal">
          <div className="modal-box">
            <input
              type="text"
              placeholder="Receive user application address"
              className="input input-bordered w-full max-w-xs"
              value={data["rua"]}
              onChange={(e) => {
                setData({ ...data, rua: e.target.value });
              }}
            />
            <textarea
              className="textarea textarea-bordered mt-2 w-full max-w-xs"
              placeholder="Data"
              value={data["data"]}
              onChange={(e) => {
                setData({ ...data, data: e.target.value });
              }}
            />
            <div className="modal-action">
              <WriteButton {...send} />
              <label htmlFor="crossChainCall" className="btn">
                Close!
              </label>
            </div>
          </div>
        </div>
      </>
    )
  );
}
