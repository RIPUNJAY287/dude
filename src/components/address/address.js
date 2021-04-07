import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "react-bootstrap";
import "./address.css";
import AddressCard from "./addressCard";
import { useHistory } from "react-router-dom";
import AddAddressModal from "./AddAddressModal";
import { useAuth } from "../../context/AuthContext";

import Spin from "../spinner/spinner";
function Address() {
  const { uid, token } = JSON.parse(localStorage.getItem("userData"));
  const { logout } = useAuth();
  const history = useHistory();
  const [addressModal, showAddressModal] = React.useState(false);
  const [address, setaddress] = useState([]);
  const hideAddressModal = () => showAddressModal(false);
  const [loading, setloading] = useState(false);
  const fetchdata = async () => {
    setloading(true);
    //fetching all the address
    await axios
      .post(
        "http://localhost:4000/api/user/address/get",
        {
          uid: uid,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        }
      )
      .then((res) => {
        setaddress(res.data);
        setloading(false);
      })
      .catch(async (err) => {
        if (err.response.data.error === "Unauthenticated");
        {
          await logout();
          console.log("UnAuthenticated");
          history.push("/login");
        }
      });
  };

  useEffect(() => {
    fetchdata();
  }, []);

  {
    if (loading === false) {
      return (
        <>
          <div className="text-center">
            {address
              ? address.map((item) => {
                  return (
                    <div>
                      <AddressCard address={item} fetchdata={fetchdata} />
                    </div>
                  );
                })
              : null}

            <AddAddressModal
              show={addressModal}
              fetchdata={fetchdata}
              onHide={hideAddressModal}
            />

            <Button
              className="btn btn-warning mt-4 "
              onClick={() => {
                showAddressModal(true);
              }}
              style={{ width: "40%" }}
            >
              Add Address
            </Button>
          </div>
        </>
      );
    } else {
      return <Spin />;
    }
  }
}
export default Address;
