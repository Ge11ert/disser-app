import React from 'react';
import TextField, { TextFieldProps } from '@material-ui/core/TextField';
import MaskedInput, { MaskedInputProps } from 'react-text-mask';

type MaskedTextFieldProps = TextFieldProps & { mask: MaskedInputProps["mask"] }

interface TextMaskCustomProps {
  inputRef: (ref: HTMLInputElement | null) => void;
}

function TextMaskCustom(props: TextMaskCustomProps) {
  const { inputRef, ...other } = props;

  return (
    <MaskedInput
      {...other}
      ref={(ref: any) => {
        inputRef(ref ? ref.inputElement : null);
      }}
      placeholderChar={'\u2002'}
    />
  );
}

const MaskedTextField = (props: MaskedTextFieldProps) => {
  const textFieldProps = { ...props };

  delete textFieldProps.mask;

  return (
    <TextField
      {...textFieldProps}
      InputProps={{
        ...textFieldProps.InputProps,
        inputComponent: (TextMaskCustom as any),
        inputProps: {
          mask: props.mask,
        },
      }}
    />
  )
};

export default MaskedTextField;
