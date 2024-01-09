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
      <div className={props.className}>
        {
          <button
            className={
              (props?.disabled || !write || confirming ? "btn-disabled " : "") +
              "btn btn-primary btn-outline text-xs "
            }
            // disabled={props?.disabled || !write || confirming}
            style={{ minWidth: 112 }}
            onClick={() => {
              if (!isConnected) {
                alert("please connect wallet");
                return;
              }
              write?.();
              if (tx) {
                try {
                  addRecentTransaction({
                    hash: tx,
                    description: props?.buttonName,
                  });
                } catch (e) {}
              }
            }}
          >
            {confirming && (
              <>
                <span className="loading loading-spinner"></span>loading
              </>
            )}

            {confirming ? lang[locale]?.confirming : props?.buttonName}
          </button>
        }
      </div>
    )
  );
};

export default WriteButton;
