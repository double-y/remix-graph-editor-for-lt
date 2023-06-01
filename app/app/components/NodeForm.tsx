import { useFetcher } from "@remix-run/react";
import { useEffect } from "react";

type NodeFormProps = {
  nodeName?: string;
  updateCallback?: (data: any) => void;
};

export default function NodeForm(props: NodeFormProps) {
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      console.log(fetcher.data);
      if (props.updateCallback) {
        props.updateCallback(fetcher.data);
      }
    }
  }, [props, fetcher]);

  return (
    <fetcher.Form method="post" action="/nodes">
      <p>
        <label>
          Node Name:
          <input type="text" name="name" />
        </label>
      </p>
      <p>
        <button
          type="submit"
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
        >
          create
        </button>
      </p>
    </fetcher.Form>
  );
}
