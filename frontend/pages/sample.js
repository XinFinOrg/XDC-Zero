import WriteButton from "@/components/WriteButton";
import { contractMapping } from "@/config";
import { useChainId, useContractReads } from "wagmi";
import sampleABI from "@/abi/sampleABI.json";
import { useState } from "react";
const Sample = () => {
  const [rerender, setRerender] = useState(0);
  const chainId = useChainId();
  const sample = contractMapping[chainId]?.sample;

  const sampleContract = { address: sample, abi: sampleABI };

  const { data: reads0 } = useContractReads({
    contracts: [{ ...sampleContract, functionName: "status" }],
    scopeKey: rerender,
  });

  const status = reads0?.[0]?.result;

  const test = {
    buttonName: "change status to 1",
    data: {
      ...sampleContract,
      functionName: "test",
    },
    callback: (confirmed) => {
      if (confirmed) {
        setRerender(rerender + 1);
      }
    },
  };
  const reset = {
    buttonName: "reset",
    data: {
      ...sampleContract,
      functionName: "reset",
    },
    callback: (confirmed) => {
      if (confirmed) {
        setRerender(rerender + 1);
      }
    },
  };

  return (
    <div className="text-center">
      <div>Application : {sample}</div>
      <div>status : {String(status)}</div>

      <WriteButton {...test} />
      <WriteButton {...reset} className="m-1" />
    </div>
  );
};

export default Sample;
