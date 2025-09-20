function Spinner({ size = "medium" }) {
  const sizes = {
    small: "w-6 h-6", // 24px
    medium: "w-12 h-12", // 48px
    large: "w-20 h-20", // 80px
  };

  return (
    <div className="flex justify-center items-center">
      <span className={`loader ${sizes[size]}`} aria-label="Loading" />
    </div>
  );
}

export default Spinner;
