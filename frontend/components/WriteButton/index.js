import { useAccount, useContractWrite, useWaitForTransaction } from "wagmi";
import { useEffect, useState } from "react";
import { Notify } from "notiflix/build/notiflix-notify-aio";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/router";
import { useAddRecentTransaction } from "@rainbow-me/rainbowkit";
import lang from "../../lang/index";
const WriteButton = (props) => {
  const { locale, locales, defaultLocale, asPath } = useRouter();
  const addRecentTransaction = useAddRecentTransaction();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { isConnected } = useAccount();

  const { data: tx, write } = useContractWrite({
    ...props?.data,
    onError(error) {
      Notify.failure(error.message);
    },
  });
  const { isSuccess: confirmed, isLoading: confirming } = useWaitForTransaction(
    {
      ...tx,
      onError(error) {
        Notify.failure(error.message);
      },
    }
  );

  useEffect(() => {
    props?.callback?.(confirmed);
  }, [confirmed]);

  return (
    mounted && (
      <>
        {!isConnected && <ConnectButton />}
        {isConnected && (
          <button
            className={
              (props?.disabled || !write || confirming ? "btn-disabled " : "") +
              (confirming
                ? "btn btn-primary loading btn-xs text-xs " + props.className
                : "btn btn-primary btn-xs text-xs" + props.className)
            }
            // disabled={props?.disabled || !write || confirming}
            style={{ minWidth: 112 }}
            onClick={() => {
              write?.();
              if (tx) {
                addRecentTransaction({
                  hash: tx,
                  description: props?.buttonName,
                });
              }
            }}
          >
            {confirming ? lang[locale]?.confirming : props?.buttonName}
          </button>
        )}
      </>
    )
  );
};

export default WriteButton;
