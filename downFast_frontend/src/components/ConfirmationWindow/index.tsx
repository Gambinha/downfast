import React, { Dispatch, SetStateAction } from "react";

import './style.css';

interface ConfirmationProps {
    setConfirmation: Dispatch<SetStateAction<string>>
    setShowConfirmationWindow: Dispatch<SetStateAction<boolean>>
}

const ConfirmationWindow: React.FC<ConfirmationProps> = (props) => {

    function confirm() {
        props.setConfirmation('true')
        props.setShowConfirmationWindow(false);
    }

    function cancel() {
        props.setConfirmation('false')
        props.setShowConfirmationWindow(false);
    }

    return(
        <div id="confirmation">
            <div id="overlay" onClick={cancel} ></div>
            <div id="confirmation-container">
                <h2>Confirmar Operação?</h2>

                <div id="confirmation-buttons-container">
                    <button id="cancel-operation" onClick={cancel} >Cancelar</button>
                    <button id="confirm-operation" onClick={confirm} >Confirmar</button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmationWindow;