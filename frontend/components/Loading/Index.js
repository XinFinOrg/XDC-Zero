const Loading = () => {
  return (
    <div className="m-auto w-1/2 gap-12 flex flex-col">
      <div className="skeleton w-full h-96"></div>
      <div className="skeleton h-12 w-full"></div>
      <div className="skeleton h-12 w-full"></div>
      <div className="skeleton h-12 w-full"></div>
    </div>
  );
};

export default Loading;
