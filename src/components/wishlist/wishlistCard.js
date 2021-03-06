import axios from "axios";
import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FaCartPlus, FaHeartBroken } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import baseUrl from "../baseUrl";
function WishlistCard(props) {
  const { currentUser, logout } = useAuth();
  const history = useHistory();

  const [size, setsize] = useState([]);
  const [sizeModal, setsizeModal] = useState();

  const selectSize = async () => {
    const availSize = props.product.details.size;
    setsize(availSize);
    setsizeModal(true);
  };

  const cancelSize = () => {
    setsizeModal(false);
  };

  const addCartItem = async (sz) => {
    if (currentUser) {
      const product = {
        quantity: 1,
        ...props.product,
      };
      product.details.size = sz;
      const { uid, token } = JSON.parse(localStorage.getItem("userData"));
      // adding the item to cart
      await axios
        .post(
          `${baseUrl}/api/merchandise/cart/add`,
          { uid: uid, product: product },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: token,
            },
          }
        )
        .then((res) => {
          toast.success("Added to Cart", {
            draggable: false,
            hideProgressBar: true,
            closeOnClick: true,
            autoClose: 2000,
            position: toast.POSITION.TOP_CENTER,
          });
          console.log("added to cart");
        })
        .catch(async (err) => {
          if (err.response.data.error === "Unauthenticated");
          {
            await logout();
            console.log("UnAuthenticated");
            history.push("/login");
            alert("Your session is expired");
          }
        });
    } else {
      history.push("./login");
      alert("login first");
    }
  };
  const WishlistRemove = async () => {
    try {
      //removing the item from wishlist
      const { uid, token } = JSON.parse(localStorage.getItem("userData"));
      const res = await axios
        .post(
          `${baseUrl}/api/merchandise/wishlist/remove`,
          {
            uid: uid,
            productId: props.product.id,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: token,
            },
          }
        )
        .then((res) => {
          toast.error("Removed from Wishlist", {
            draggable: false,
            hideProgressBar: true,
            closeOnClick: true,
            autoClose: 2000,
            position: toast.POSITION.TOP_CENTER,
          });
          props.fetchlist();
        })
        .catch(async (err) => {
          if (err.response.data.error === "Unauthenticated");
          {
            await logout();
            console.log("UnAuthenticated");
            history.push("/login");
            alert("Your session is expired");
          }
        });
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <>
      <div
        class="card container shadow p-0 my-5 mx-auto text-center "
        style={{ width: "20rem" }}
      >
        <img
          class="card-img-top"
          height="350px"
          src={props.product.ImgLink}
          alt="T-Shirt"
        />
        <h5 className="m-auto">{props.product.title}</h5>
        <div class="card-footer text-center ">
          <h5 class="float-left mt-1">Rs {props.product.price}</h5>
          <button
            onClick={WishlistRemove}
            class="btn btn-danger rounded-circle"
          >
            <FaHeartBroken />
          </button>
          <button
            class="btn btn-success rounded float-right"
            onClick={selectSize}
          >
            <FaCartPlus />
          </button>
        </div>
      </div>
      <Modal
        id="sizeModal"
        show={sizeModal}
        onHide={cancelSize}
        style={{ margin: "220px auto 0px auto", borderRadius: "30px" }}
      >
        {/* <Modal.Header className="py-1" closeButton> */}
        {/* <h4 style={{ marginLeft: "35%" }}> Select the size </h4> */}
        {/* </Modal.Header> */}
        <Modal.Body class="my-1 text-center">
          <h5 className="mt-1"> Select the size </h5>
          {size
            ? size.map((item) => {
                return (
                  <button
                    class="btn btn-outline-warning  py-2 px-3 m-4 rounded"
                    onClick={() => addCartItem(item)}
                  >
                    {item}
                  </button>
                );
              })
            : null}
        </Modal.Body>
      </Modal>

      <ToastContainer />
    </>
  );
}

export default WishlistCard;
