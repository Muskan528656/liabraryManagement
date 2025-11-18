import React, { useState } from "react";

const Path = (props) => {
    const [values, setValues] = useState(props.values ? props.values : []);
    const [selectedValue, setSelectedValue] = useState(props.selectedValue ? props.selectedValue : '');

    const getClassName = (currentVal, selectedVal) => {
        if (currentVal.label === selectedVal) {
            if (currentVal.is_lost || currentVal.is_converted)
                return "bar-step completed";
            else
                return "bar-step active";
        } else if (values.findIndex(val => val.label === currentVal.label) < values.findIndex(val => val.label === selectedVal) && currentVal.is_lost === false && currentVal.is_converted === false) {
            return "bar-step completed";
        } else {
            return "bar-step ";
        }
    }

    return (


        <>
            <div class="bar">

                {values.map((val) => {
                    return <div className={
                        getClassName(val, selectedValue)
                    }>{val.label}</div>
                })}

            </div>
        </>
    )
}
export default Path;
