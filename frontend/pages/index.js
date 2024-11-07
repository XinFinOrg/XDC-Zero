import {
  useAccount,
  useChainId,
  useContractReads,
  usePublicClient,
} from "wagmi";
import { contractMapping } from "../config";
import endpointABI from "../abi/endpointABI.json";
import oracleABI from "../abi/oracleABI.json";
import WriteButton from "@/components/WriteButton";
import { useEffect, useState } from "react";
import Loading from "@/components/Loading/Index";
export default function Home() {
  const [rerender, setRerender] = useState(0);
  const [data, setData] = useState({});
  const [mount, setMount] = useState(false);
  const publicClient = usePublicClient();

  const chainId = useChainId();

  const endpoint = contractMapping[chainId]?.endpoint;
  const oracle = contractMapping[chainId]?.oracle;

  const oracleContract = { address: oracle, abi: oracleABI };

  const endpointContract = {
    address: endpoint,
    abi: endpointABI,
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const logs = await publicClient.getContractEvents({
          ...endpointContract,
          eventName: "PacketReceived",
          fromBlock: 0n,
        });

        console.log(logs);
        data.logs = logs;
        setData({ ...data });
      } catch (e) {
      } finally {
      }
    }

    fetchData();
    setMount(true);
  }, [endpoint]);

  const { data: reads0 } = useContractReads({
    contracts: [
      { ...endpointContract, functionName: "getChainId" },
      { ...endpointContract, functionName: "getSendChainIds" },
    ],
    scopeKey: rerender,
  });

  console.log(reads0);

  const eChainId = reads0?.[0]?.result;

  const eChainIds = reads0?.[1]?.result;

  const { data: reads1 } = useContractReads({
    contracts: eChainIds?.map((key) => {
      return { ...endpointContract, functionName: "getSendChain", args: [key] };
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

  const validateTransaction = {
    buttonName: "validate Transaction Proof",
    data: {
      ...endpointContract,
      functionName: "validateTransactionProof",
      args: [
        data["validateCid"],
        data["validateKey"],
        JSON.parse(data["validateReceiptProof"] || "[]"),
        JSON.parse(data["validateTransactionProof"] || "[]"),
        data["validateBlockHash"],
      ],
    },
    callback: (confirmed) => {
      if (confirmed) {
        setData({});
        setRerender(rerender + 1);
      }
    },
  };

  const addHeader = {
    buttonName: "Add Header",
    data: {
      ...oracleContract,
      functionName: "addRoot",
      args: [
        data["addBlockHash"],
        data["addStateRoot"],
        data["addTransactionsRoot"],
        data["addReceiptRoot"],
      ],
    },
    callback: (confirmed) => {
      if (confirmed) {
        setData({});
        setRerender(rerender + 1);
      }
    },
  };

  return mount ? (
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
              htmlFor="approvedSua"
            >
              Approved Sua List
            </label>
            <label
              className="btn btn-success w-max btn-sm"
              htmlFor="receiveBox"
            >
              Rua logs
            </label>
            <label
              className="btn btn-success w-max btn-sm"
              htmlFor="validateTransaction"
            >
              Validate Transaction
            </label>
            <label
              className="btn btn-success w-max btn-sm"
              htmlFor="registerChain"
            >
              Register a Chain
            </label>
          </div>

          <div className="divider"></div>
          {eChainIds?.map((key, index) => {
            return (
              <div className="card shadow-2xl">
                <div className="card-body">
                  <div className="font-black">
                    Remote ChainId : {key?.toString()}
                  </div>
                  <div className="font-black">
                    Local CSC : {eChains?.[index]?.csc}
                  </div>
                  <div className="font-black">
                    Remote Enpoint : {eChains?.[index]?.endpoint}
                  </div>
                  <div className="card-actions justify-end">
                    <label
                      className="btn btn-warning w-max btn-sm"
                      htmlFor="approvedRua"
                    >
                      Approved Rua List
                    </label>
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

      {/* Put this part before </body> tag */}
      <input
        type="checkbox"
        id="validateTransaction"
        className="modal-toggle"
      />
      <div className="modal">
        <div className="modal-box">
          <input
            type="text"
            placeholder="cid"
            className="input w-full max-w-xs input-bordered"
            value={data["validateCid"]}
            onChange={(e) => {
              setData({ ...data, validateCid: e.target.value });
            }}
          />
          <input
            type="text"
            placeholder="key"
            className="input w-full max-w-xs input-bordered mt-1"
            value={data["validateKey"]}
            onChange={(e) => {
              setData({ ...data, validateKey: e.target.value });
            }}
          />
          <input
            type="text"
            placeholder="receiptProof"
            className="input w-full max-w-xs input-bordered mt-1"
            value={data["validateReceiptProof"]}
            onChange={(e) => {
              setData({
                ...data,
                validateReceiptProof: e.target.value?.replaceAll("'", '"'),
              });
            }}
          />
          <input
            type="text"
            placeholder="transactionProof"
            className="input w-full max-w-xs input-bordered mt-1"
            value={data["validateTransactionProof"]}
            onChange={(e) => {
              setData({
                ...data,
                validateTransactionProof: e.target.value?.replaceAll("'", '"'),
              });
            }}
          />
          <input
            type="text"
            placeholder="blockHash"
            className="input w-full max-w-xs input-bordered mt-1"
            value={data["validateBlockHash"]}
            onChange={(e) => {
              setData({ ...data, validateBlockHash: e.target.value });
            }}
          />
          <div className="modal-action">
            <WriteButton {...validateTransaction} />
            <label htmlFor="validateTransaction" className="btn">
              Close!
            </label>
          </div>
        </div>
      </div>

      <input type="checkbox" id="oracle" className="modal-toggle" />
      <div className="modal">
        <div className="modal-box">
          <input
            type="text"
            placeholder="addBlockHash"
            className="input w-full max-w-xs input-bordered"
            value={data["addBlockHash"]}
            onChange={(e) => {
              setData({ ...data, addBlockHash: e.target.value });
            }}
          />
          <input
            type="text"
            placeholder="addStateRoot"
            className="input w-full max-w-xs input-bordered mt-1"
            value={data["addStateRoot"]}
            onChange={(e) => {
              setData({ ...data, addStateRoot: e.target.value });
            }}
          />
          <input
            type="text"
            placeholder="addTransactionsRoot"
            className="input w-full max-w-xs input-bordered mt-1"
            value={data["addTransactionsRoot"]}
            onChange={(e) => {
              setData({ ...data, addTransactionsRoot: e.target.value });
            }}
          />
          <input
            type="text"
            placeholder="addReceiptRoot"
            className="input w-full max-w-xs input-bordered mt-1"
            value={data["addReceiptRoot"]}
            onChange={(e) => {
              setData({ ...data, addReceiptRoot: e.target.value });
            }}
          />

          <div className="modal-action">
            <WriteButton {...addHeader} />
            <label htmlFor="oracle" className="btn">
              Close!
            </label>
          </div>
        </div>
      </div>

      <input type="checkbox" id="receiveBox" className="modal-toggle" />
      <div className="modal">
        <div className="modal-box">
          {data?.logs?.map((log) => {
            const args = log?.args;
            return (
              <div className="card shadow-2xl" key={log?.logIndex}>
                <div className="card-body overflow-auto">
                  <div>sid:{args?.sid?.toString()}</div>
                  <div>index:#{args?.index?.toString()}</div>
                  <div>rua:{args?.rua}</div>
                  <div>data:{args?.data}</div>
                </div>
              </div>
            );
          })}

          <div className="modal-action">
            <label htmlFor="receiveBox" className="btn">
              Close!
            </label>
          </div>
        </div>
      </div>

      <input type="checkbox" id="approvedRua" className="modal-toggle" />
      <div className="modal">
        <div className="modal-box">
          <div className="modal-action">
            <label htmlFor="approvedRua" className="btn">
              Close!
            </label>
          </div>
        </div>
      </div>

      <input type="checkbox" id="approvedSua" className="modal-toggle" />
      <div className="modal">
        <div className="modal-box">
          <div className="modal-action">
            <label htmlFor="approvedSua" className="btn">
              Close!
            </label>
          </div>
        </div>
      </div>
    </>
  ) : (
    <Loading />
  );
}
