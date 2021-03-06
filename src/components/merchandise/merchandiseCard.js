import axios from "axios";
import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import { FaHeart, FaCartPlus } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import refreshToken from "../refreshToken";
import "react-toastify/dist/ReactToastify.css";
import baseUrl from "../baseUrl";
function MerchandiseCard(props) {
  const { currentUser, logout } = useAuth();
  const history = useHistory();
  const [size, setsize] = useState([]);

  const [sizeModal, setsizeModal] = useState();

  //selecting the size of t-shirt
  const selectSize = async () => {
    const availSize = props.product.details.size;
    setsize(availSize);
    setsizeModal(true);
  };

  const cancelSize = () => {
    setsizeModal(false);
  };
  // to add the item in cart
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
          refreshToken(token, uid);
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

  // to add the item in wishlist
  const WishlistItem = async (sz) => {
    if (currentUser) {
      const { uid, token } = JSON.parse(localStorage.getItem("userData"));
      await axios
        .post(
          `${baseUrl}/api/merchandise/addwishlist`,
          { uid: uid, productId: props.product.id },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: token,
            },
          }
        )
        .then((res) => {
          toast.success("Added to Wishlist", {
            draggable: false,
            hideProgressBar: true,
            closeOnClick: true,
            autoClose: 2000,
            position: toast.POSITION.TOP_CENTER,
          });
          console.log("added to wishlist");
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
          <button onClick={WishlistItem} class="btn btn-danger rounded-circle">
            <FaHeart />
          </button>
          <button
            onClick={selectSize}
            class="btn btn-success rounded float-right"
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
        {/* <Modal.Header className="py-1" closeButton>
          <h5 style={{ marginLeft: "38%" }}> Select the size </h5>
        </Modal.Header> */}
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

export default MerchandiseCard;
