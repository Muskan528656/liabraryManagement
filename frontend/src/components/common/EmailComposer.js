import React, { useState, useEffect } from 'react';
import { Button, Container, Form, Modal } from 'react-bootstrap';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import jwt_decode from "jwt-decode";
import WhatsAppAPI from "../../api/WhatsAppAPI";




const EmailComposer = (props) => {
    const [value, setValue] = useState('');
    const [email, setEmail] = useState({ to: props.toEmail });
    const [user, setUser] = useState();
    const [parentid, setParentid] = useState(props.parentid);
    const modules = {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],        // toggled buttons


            // custom button values
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'script': 'sub' }, { 'script': 'super' }],      // superscript/subscript
            [{ 'indent': '-1' }, { 'indent': '+1' }],          // outdent/indent
            // text direction

            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

            [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme

            [{ 'align': [] }],
            ['link'],
            ['clean']
        ],
    };

    const formats = [
        'font', 'size',
        'bold', 'italic', 'underline', 'strike',
        'color', 'background',
        'script',
        'header', 'blockquote', 'code-block',
        'indent', 'list',
        'direction', 'align',
        'link', 'image', 'video', 'formula',
    ];

    useEffect(() => {
        let userInfo = jwt_decode(sessionStorage.getItem('token'));
        let tempValue = { id: userInfo.id, 'username': userInfo.username, email: userInfo.email };
        setUser(tempValue);
        setEmail({ ...email, ['editorHtml']: `<br/><br/><b>Thanks</b><br/>${userInfo.username}` });

    }, []);

    const handleChange = (e) => {
        setEmail({ ...email, [e.target.name]: e.target.value });
    };

    const handleChangeEditor = (html) => {
        setEmail({ ...email, ['editorHtml']: html });

    };

    const handleSubmit = async (e) => {
        email.from = `${user.username}<${user.email}>`;
        email.ownerid = user.id;
        email.parentid = parentid;



        const result = await WhatsAppAPI.sendEmailTask(email);
        if (result) {
            submitTasks();
        }

    };

    const submitTasks = () => {
        props.submitTasks();
    };


    return (

        <Modal

            {...props}
            aria-labelledby="contained-modal-title-vcenter"
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                    Email Composer
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container className="view-form">
                    <Form.Group className="mx-3" controlId="formBasicTitle">
                        <Form.Label className="form-view-label" htmlFor="formBasicTitle">
                            Subject
                        </Form.Label>
                        <Form.Control
                            required
                            type="text"
                            name="subject"
                            placeholder="Enter subject"
                            value={email.title}
                            onChange={handleChange}
                        />
                    </Form.Group>
                    <Form.Group className="mx-3" controlId="formBasicTitle">
                        <Form.Label className="form-view-label" htmlFor="formBasicTitle">
                            To
                        </Form.Label>
                        <Form.Control
                            required
                            type="text"
                            name="to"
                            placeholder="Comma separated email address"
                            value={email.to}
                            onChange={handleChange}
                        />
                    </Form.Group>
                    <Form.Group className="mx-3" controlId="formBasicTitle">
                        <Form.Label className="form-view-label" htmlFor="formBasicTitle">
                            Cc
                        </Form.Label>
                        <Form.Control

                            type="text"
                            name="cc"
                            placeholder="Comma separated email address"
                            value={email.cc}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    <Form.Group className="mx-3" controlId="formBasicTitle">
                        <Form.Label className="form-view-label" htmlFor="formBasicTitle">
                            Body
                        </Form.Label>
                        <ReactQuill onChange={handleChangeEditor}
                            value={email.editorHtml} theme="snow" modules={modules}
                            formats={formats} />
                    </Form.Group>

                </Container>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="success" onClick={handleSubmit}>Save</Button>
                <Button onClick={props.onHide} variant="light">Close</Button>
            </Modal.Footer>
        </Modal>
    )
}
export default EmailComposer;
