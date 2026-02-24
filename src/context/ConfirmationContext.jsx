import { createContext, useContext, useState } from "react";

const ConfirmationModalContext = createContext();
export const useConfirmModal = () => useContext(ConfirmationModalContext);

export const ConfirmationModalProvider = ({ children }) => {
    const [modal, setModal] = useState({
        open: false,
        message: "",
        buttonText: "OK",
        onConfirm: null,
    });

    // OPEN MODAL
    const openConfirm = (message, options = {}) => {
        setModal({
            open: true,
            message,
            buttonText: options.buttonText || "OK",
            onConfirm: options.onConfirm || null,
        });

        if (options.autoClose) {
            setTimeout(() => closeConfirm(), options.autoClose);
        }

    };

    // CLOSE MODAL
    const closeConfirm = () => {
        setModal({ ...modal, open: false });
    };

    const confirm = () => {
        if (modal.onConfirm) modal.onConfirm();
        closeConfirm();
    };

    return (
        <ConfirmationModalContext.Provider
            value={{
                modal,
                openConfirm,
                closeConfirm,
                confirm,
            }}
        >
            {children}
        </ConfirmationModalContext.Provider>
    );
};
