import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

export default function CustomDialog({ open, children, title, contentText, handleContinue }) {
    return (
        <Dialog open={open}> {/* Dialog container */}
            <DialogTitle>
                {title}
            </DialogTitle>
            <DialogContent> {/* Container for the main body of the modal/dialog */}
                <DialogContentText> {/* Main text container */}
                    {contentText}
                </DialogContentText>
                {children} {/* Other Content */}
            </DialogContent>
            <DialogActions> {/* Dialog action button */}
                {/* Force users to make input without option to cancel */}
                {/* <button onClick={handleContinue}>Cancel</Button> */}
                <Button onClick={handleContinue}>Continue</Button>
            </DialogActions>
        </Dialog>
    );
}

/*
This component uses the open prop to determine if the dialog should be rendered. Also uses to children prop to get the component's children, which are rendered to in the dialog content. The dialog is then titled, and a message is displayed in the dialog. Finally the handleContinued is a function to be called whne the continue button is clicked.
*/