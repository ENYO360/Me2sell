import { useNetwork } from "../../context/NetworkContext";

const NetworkBanner = () => {
  const { isOnline, isSlow } = useNetwork();

  if (!isOnline) {
    return (
      <div style={{ ...styles.banner, background: "#d32f2f" }}>
        🚫 No internet connection.
        <p className="text-[10px]">Your data won't be saved</p>
      </div>
    );
  }

  if (isSlow) {
    return (
      <div style={{ ...styles.banner, background: "#f9a825" }}>
        📶 Slow network detected. Some features may load slowly.
      </div>
    );
  }

  return null;
};

const styles = {
  banner: {
    position: "fixed",
    top: 80,
    left: "40%",
    width: "30%",
    color: "#fff",
    padding: "5px",
    textAlign: "center",
    zIndex: 9999,
    fontWeight: "500",
    borderRadius: "10px",
    fontSize: "10px"
  },
};

export default NetworkBanner;
