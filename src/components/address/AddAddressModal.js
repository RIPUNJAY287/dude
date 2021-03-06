import React from "react";
import { Form, InputGroup, Modal, Button } from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import baseUrl from "../baseUrl";
import { useHistory } from "react-router-dom";
export default function AddAddressModal(props) {
  const housenoRef = React.useRef();
  const line1Ref = React.useRef();
  const line2Ref = React.useRef();
  const cityRef = React.useRef();
  const stateRef = React.useRef();
  const pincodeRef = React.useRef();
  const titleRef = React.useRef();
  const { logout } = useAuth();
  const history = useHistory();
  const handleSubmit = async (e) => {
    e.preventDefault();
    const address = {
      title: titleRef.current.value,
      houseNumber: housenoRef.current.value,
      line1: line1Ref.current.value,
      line2: line2Ref.current.value,
      city: cityRef.current.value,
      state: stateRef.current.value,
      pincode: pincodeRef.current.value,
    };
    try {
      //checking if the pincode of address is available for delivery or not
      const { token, uid } = JSON.parse(localStorage.getItem("userData"));
      await axios
        .post(`${baseUrl}/api/pincode/check`, {
          pincode: pincodeRef.current.value,
        })
        .then(async (resp) => {
          // if pincode is available then adding the address
          if (resp.data.success === true) {
            const res = await fetch(`${baseUrl}/api/user/address/add`, {
              method: "post",
              headers: {
                "Content-Type": "application/json",
                Authorization: token,
              },
              body: JSON.stringify({
                address: address,
                uid: uid,
              }),
            });
            if (res) {
              // if address is added then hiding the modal and showing the fetching the data again
              props.fetchdata();
              props.onHide();
            }
          } else {
            alert(
              "Pincode is not available for Delivery, Change your Address. available pincode  : 824101, 824121, 800001, 800005"
            );
          }
        })
        .catch(async (err) => {
          if (err.response.data.error === "Unauthenticated");
          {
            await logout();
            console.log("UnAuthenticated");
            history.push("/login");
            alert("your session is expired");
          }
        });
    } catch (Err) {
      console.log(Err);
    }
  };
  return (
    <Modal show={props.show} onHide={props.onHide} centered>
      <Modal.Header closeButton={true}>
        <Modal.Title as="h6" id="add-address">
          Add Delivery Address
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <div className="form-row">
            <Form.Group className="col-md-12">
              <Form.Label>Title</Form.Label>
              <InputGroup>
                <Form.Control
                  size="sm"
                  type="text"
                  placeholder="title"
                  ref={titleRef}
                />
              </InputGroup>
            </Form.Group>
            <Form.Group className="col-md-12">
              <Form.Label>House No.</Form.Label>
              <InputGroup>
                <Form.Control
                  size="sm"
                  type="text"
                  placeholder="House no."
                  ref={housenoRef}
                />
              </InputGroup>
            </Form.Group>
            <Form.Group className="col-md-12">
              <Form.Label>Address Line 1</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="Line 1"
                  ref={line1Ref}
                />
              </InputGroup>
            </Form.Group>
            <Form.Group className="col-md-12">
              <Form.Label>Address Line 2</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="Line 2"
                  ref={line2Ref}
                />
              </InputGroup>
            </Form.Group>
            <Form.Group className="col-md-12">
              <Form.Label>City</Form.Label>
              <InputGroup>
                <Form.Control
                  size="sm"
                  type="text"
                  readOnly
                  value="Patna"
                  ref={cityRef}
                />
              </InputGroup>
            </Form.Group>
            <Form.Group className="col-md-12">
              <Form.Label>State</Form.Label>
              <InputGroup>
                <Form.Control
                  size="sm"
                  type="text"
                  readOnly
                  value="Bihar"
                  ref={stateRef}
                />
              </InputGroup>
            </Form.Group>
            <Form.Group className="col-md-12">
              <Form.Label>Pincode</Form.Label>
              <InputGroup>
                <Form.Control
                  size="sm"
                  type="number"
                  placeholder="Pincode"
                  ref={pincodeRef}
                />
              </InputGroup>
            </Form.Group>
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          type="button"
          onClick={handleSubmit}
          variant="primary"
          className="d-flex w-50 text-center justify-content-center"
        >
          Submit
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
