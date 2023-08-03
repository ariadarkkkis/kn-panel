import React from "react";
import ReactDOM from "react-dom";
import { motion } from "framer-motion"

import "./Modal.css";

const Modal = ({ children, onClose, v2, tall }) => {
    return ReactDOM.createPortal(
        <motion.div
            className="modal"
            onMouseDown={onClose}
            onMouseUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            style={tall && { position: "absolute" }}
        >
            <div className="modal__background" ></div>
            <motion.div
                className={v2 ? "modal__content modal_content_v2" : "modal__content"}
                onMouseUp={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                initial={{ scale: 0.9, opacity: 1 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 1 }}
                transition={{ duration: 0.1 }}
            >
                {children}
            </motion.div>
        </motion.div >,
        document.querySelector(".modal-container")
    )
}

export default Modal;