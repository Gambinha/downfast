import React, {InputHTMLAttributes} from 'react';

import './style.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement>{
    name: string;
    placeholder: string;
    type: string;
}

const Input: React.FC<InputProps> = ({ placeholder, name, type, ...rest }) => {
    return(
        <div className="input-block">
            <input name={name} type={type} {...rest} placeholder={placeholder}/>
         </div>
    );
}

export default Input;