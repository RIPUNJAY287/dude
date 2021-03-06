import React, { useEffect, useState, useRef } from "react";
import { AiOutlinePercentage } from "react-icons/ai";
import axios from "axios";
import { useHistory } from "react-router-dom";
import { Row, Col, Button, Form, Modal, InputGroup } from "react-bootstrap";
import ChooseAddressCard from "../address/chooseaddresscard";
import "./checkout.css";
import Spin from "../spinner/spinner";
import baseUrl from "../baseUrl";
import { useAuth } from "../../context/AuthContext";
function loadrazorpay(src) {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

function Checkout(props) {
  const history = useHistory();

  const [addressData, setaddressData] = useState([]);
  const [orderAddress, setorderAddress] = useState(null);
  const [addressModal, showAddressModal] = React.useState(false);
  const [totalPrice, setotalPrice] = useState(0);
  const [addressAlert, setAddressAlert] = useState(false);
  const [cashOrder, setcashOrder] = useState(false);
  const [loading, setloading] = useState(false);
  const [promoMessage, setpromoMessage] = useState("");
  const [promoPercentage, setpromoPercentage] = useState(0);
  const [discountPrice, setdiscountPrice] = useState(0);
  const [promo, setpromo] = useState("");
  const [promoApply, setpromoApply] = useState(false);
  const [promoApplying, setpromoApplying] = useState("none");
  const promocodeRef = useRef();
  const { logout } = useAuth();

  const onlinepayment = async () => {
    const { uid, token } = JSON.parse(localStorage.getItem("userData"));
    if (orderAddress === null) {
      //checking if address is selected , if not then showing a modal to select the address
      setAddressAlert(true);
      return;
    } else if (promoApply === true) {
      // if promocode is applied then proceed this way
      setpromoApplying("inline");
      const promocodeString = promocodeRef.current.value;
      await axios
        .post(
          `${baseUrl}/api/promocode/avail-promocode`,
          {
            uid: uid,
            promocode: promocodeString,
          },
          {
            headers: {
              Authorization: token,
            },
          }
        )
        .then(async (res) => {
          setpromoApplying("none");
          console.log(res);
          if (res.data.error === true) {
            alert(res.data.message);
            setdiscountPrice(0);
            setpromoApply(false);
            setpromoMessage("Promocode Not Available");
          } else {
            displayRazorpay();
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
          console.log(err);
        });
    } else {
      // if promocode is not applied then this way
      displayRazorpay();
    }
  };

  //RAZORPAY CALL
  async function displayRazorpay() {
    const totalAmount = totalPrice - discountPrice + 49;
    const res = await loadrazorpay(
      "https://checkout.razorpay.com/v1/checkout.js"
    );
    if (!res) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }
    const { uid, token, name, phone, email } = JSON.parse(
      localStorage.getItem("userData")
    );
    // sending the data to backend for checking
    const payment = await axios
      .post(
        `${baseUrl}/api/payment/razorpay`,
        {
          type: 1,
          uid: uid,
          price: totalAmount,
        },
        {
          headers: { "Content-Type": "application/json", Authorization: token },
        }
      )
      .then((res) => {
        const options = {
          key: process.env.REACT_APP_RAZORPAY_API_KEY,
          currency: res.data.currency,
          amount: res.data.amount.toString(),
          order_id: res.data.id,
          name: "Merchandise Order",
          description: "Thank you for nothing. Please give us some money",
          handler: async function (response) {
            const newdate = new Date();
            // adding the order to database after successful payment
            await axios
              .post(
                `${baseUrl}/api/order/add`,
                {
                  userId: uid,
                  Address: orderAddress,
                  items: props.location.state.cartItem,
                  billing: {
                    baseprice: totalPrice,
                    discount: discountPrice,
                    deliveryCharge: 49,
                    finalAmount: res.data.amount,
                    promocode: promo,
                    orderTime: {
                      timestamp: newdate.getTime(),
                    },
                    paymentMethod: "ONLINE",
                  },
                  paymentId: response.razorpay_payment_id,
                  id: response.razorpay_order_id,
                  RazorpaySignature: response.razorpay_signature,
                },
                {
                  headers: { Authorization: token },
                }
              )
              .then((t) => {
                console.log("successful payment done");
                // adding the order id in user
                axios
                  .post(
                    `${baseUrl}/api/user/add-orderId`,
                    {
                      uid: uid,
                      orderId: response.razorpay_order_id,
                    },
                    {
                      headers: { Authorization: token },
                    }
                  )
                  .then((t) => {
                    // deleting all the item from the cart
                    axios
                      .post(
                        `${baseUrl}/api/user/cart/delete`,
                        {
                          uid: uid,
                        },
                        {
                          headers: { Authorization: token },
                        }
                      )
                      .then((res) => {
                        console.log("got to thanks page");
                      })
                      .catch((err) => {
                        console.log(err.response);
                      });
                    history.push("./thanks");
                  })
                  .catch((err) => {
                    console.log(err.response);
                  });
              })
              .catch((err) => {
                history.push("./failed");
                console.log(err.response);
              });
          },
          // saving some information of user in razorpay
          prefill: {
            name: name,
            email: email,
            phone_number: phone,
          },
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();

        paymentObject.on("payment.failed", function (response) {
          // if payment is failed
          console.log("you failed to pay");
          history.push("./failed");
        });
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
  }

  //For Cash Payment
  async function cashPay() {
    const { uid, token } = JSON.parse(localStorage.getItem("userData"));
    if (promoApply === true) {
      //if promocode is applied then proceed this way
      const promocodeString = promocodeRef.current.value;
      // using the promocode that are applied just before payment
      await axios
        .post(
          `${baseUrl}/api/promocode/avail-promocode`,
          {
            uid: uid,
            promocode: promocodeString,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: token,
            },
          }
        )
        .then(async (res) => {
          console.log(res.data);
          if (res.data.error === true) {
            alert(res.data.message);
            setdiscountPrice(0);
            setpromoApply(false);
            setpromoMessage("Promocode Not Available");
          } else {
            cashpayment();
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
    } else {
      //if promocode is not applied then proceed this way
      cashpayment();
    }
  }
  // function for offline payment
  const cashpayment = async () => {
    const totalAmount = totalPrice - discountPrice + 49;
    setloading(true);
    const { uid, token } = JSON.parse(localStorage.getItem("userData"));
    try {
      //sending the data to backend for checking
      const resdata = await axios
        .post(
          `${baseUrl}/api/payment/razorpay`,
          {
            type: 0,
            uid: uid,
            price: totalAmount,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: token,
            },
          }
        )
        .then(async (resdata) => {
          if (resdata.data.error === false) {
            const order_id = resdata.data.message;
            const newdate = new Date();
            //addding the order
            await axios
              .post(
                `${baseUrl}/api/order/add`,
                {
                  userId: uid,
                  id: order_id,
                  Address: orderAddress,
                  items: props.location.state.cartItem,
                  billing: {
                    baseprice: totalPrice,
                    discount: discountPrice,
                    deliveryCharge: 49,
                    finalAmount: totalAmount,
                    promocode: promo,
                    orderTime: {
                      timestamp: newdate.getTime(),
                    },
                    paymentMethod: "CASH",
                  },
                },
                {
                  headers: { Authorization: token },
                }
              )
              .then((t) => {
                if (t) {
                  console.log("successful payment done");
                  //adding the orderid in user
                  axios
                    .post(
                      `${baseUrl}/api/user/add-orderId`,
                      {
                        uid: uid,
                        orderId: order_id,
                      },
                      {
                        headers: { Authorization: token },
                      }
                    )
                    .then((t) => {
                      // delete the all item from cart
                      axios
                        .post(
                          `${baseUrl}/api/user/cart/delete`,
                          {
                            uid: uid,
                          },
                          {
                            headers: { Authorization: token },
                          }
                        )
                        .then((res) => {
                          //delete the cart item
                        })
                        .catch(async (err) => {
                          console.log(err);
                        });
                      console.log("got to thanks page");
                      history.push("./thanks");
                      setloading(false);
                    })
                    .catch((err) => {
                      history.push("./failed");
                      console.log(err.response);
                    });
                }
              })
              .catch(async (err) => {
                if (err.response.data.error === "Unauthenticated");
                {
                  await logout();
                  console.log("UnAuthenticated");
                  history.push("/login");
                  alert("your session is expired");
                  return;
                }

                history.push("./failed");
                console.log(err.response);
              });
          } else {
            history.push("./failed");
            console.log("it failed to order");
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
    } catch (err) {
      console.log(err);
      history.push("./failed");
    }
  };

  //available checking promocode
  const checkPromocode = async () => {
    const { uid, token } = JSON.parse(localStorage.getItem("userData"));
    if (promocodeRef.current.value !== "") {
      setpromoMessage("");
      const promostring = promocodeRef.current.value;
      //checking the promocode availability
      await axios
        .post(
          `${baseUrl}/api/promocode/check-promocode`,
          {
            uid: uid,
            promocode: promocodeRef.current.value,
          },
          {
            headers: { Authorization: token },
          }
        )
        .then((res) => {
          //if promocode is available
          if (res.data.error === false) {
            const percent = res.data.promocode.Percentage;
            setpromoMessage(`${res.data.message} & will apply`);
            setpromoPercentage(percent);
            setpromo(promostring);
            const amt = parseInt(
              (totalPrice * res.data.promocode.Percentage) / 100
            );
            setdiscountPrice(amt);
            setpromoApply(true);
            //setting the discount price if promocode is available
          } else {
            // if promocode is not availbale
            setpromoMessage("Promocode Not Available");
            setpromoPercentage(0);
            setdiscountPrice(0);
            setpromoApply(false);
            setpromo("");
          }
        })
        .catch(async (err) => {
          setpromoMessage("Promocode Not Available");
          setpromoPercentage(0);
          setdiscountPrice(0);
          setpromo("");
          setpromoApply(false);
          console.log(err);
          if (err.response.data.error === "Unauthenticated");
          {
            await logout();
            console.log("UnAuthenticated");
            history.push("/login");
            alert("your session is expired");
          }
        });
    } else {
      alert("enter promocode");
    }
  };

  const hideAddressModal = () => showAddressModal(false);

  //for Hide and show Modal on click pay
  const cashorder = () => {
    if (orderAddress !== null) {
      setAddressAlert(false);
      setcashOrder(true);
    } else {
      setcashOrder(false);
      setAddressAlert(true);
    }
  };
  const cancelcashOrder = () => {
    setcashOrder(false);
    setAddressAlert(false);
  };

  const fetchdata = async () => {
    setloading(true);
    // fetching the address of user
    const { uid, token } = JSON.parse(localStorage.getItem("userData"));
    await axios
      .post(
        `${baseUrl}/api/user/address/get`,
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
        setaddressData(res.data);
        setloading(false);
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
  };

  useEffect(() => {
    fetchdata();
    setotalPrice(props.location.state.totalprice);
  }, []);

  if (loading === false) {
    return (
      <>
        <Row className="clothes-background py-3">
          <Col lg={6} className=" my-4">
            {addressData.map((item, index) => {
              return (
                <div
                  className="container text-md-center text-sm-center  containAddress"
                  key={index}
                >
                  <h4>Choose Order Address</h4>
                  <Form.Check
                    inline
                    type="radio"
                    name="address-radio"
                    onClick={() => {
                      setorderAddress(item);
                    }}
                    label={<ChooseAddressCard address={item} />}
                  ></Form.Check>
                </div>
              );
            })}
          </Col>
          <Col lg={6}>
            <div className="paymentcheck">
              <div className="px-3">
                {" "}
                <h5 className="text-center p-1 my-4 pt-3 text-white">
                  RJ STORE - Your Order
                </h5>
                <InputGroup className="input-group-sm mb-2">
                  <Form.Control
                    className="p-3"
                    type="text"
                    placeholder="Enter promo code"
                    ref={promocodeRef}
                  />

                  <InputGroup.Append>
                    <Button
                      variant="primary"
                      type="button"
                      onClick={checkPromocode}
                    >
                      <AiOutlinePercentage /> APPLY
                    </Button>
                  </InputGroup.Append>
                </InputGroup>
                <p className="text-white">{promoMessage}</p>
                <div className="bg-light px-3 py-1">
                  <p className="float-right ">
                    {" "}
                    {props.location.state.itemNumber}
                  </p>
                  <p>No. of Item</p>
                  <p className="float-right">
                    Rs {props.location.state.totalprice}{" "}
                  </p>
                  <p>Price</p>
                  <p className="float-right">Rs {discountPrice}</p>
                  <p>Discount % </p>
                  <p className="float-right">Rs 49</p>
                  <p>Delivery Charge </p>
                </div>
              </div>

              <div className="bg-light mx-3 my-1 px-3 py-2  ">
                <h6 className="float-right">
                  Rs {totalPrice - discountPrice + 49}
                </h6>
                <h6>To Pay </h6>
              </div>
              <p className="mx-3 text-white text-center">
                Note : Promocode will apply a moment you start payment procedure
              </p>
              <div className=" container text-center">
                <p
                  className="text-white p-0 m-0"
                  style={{ display: promoApplying, fontSize: "12px" }}
                >
                  Applying Promocode...
                </p>
                <Button
                  className="btn btn-danger mt-3 mb-2 d-block mx-auto"
                  style={{ width: "80%" }}
                  onClick={onlinepayment}
                >
                  Pay Now {totalPrice - discountPrice + 49}
                </Button>
                <Button
                  className="btn btn-warning mb-2"
                  style={{ width: "80%" }}
                  onClick={cashorder}
                >
                  Cash On Delivery {totalPrice - discountPrice + 49}
                </Button>
              </div>
            </div>

            <Modal
              id="cashModal"
              show={cashOrder}
              onHide={cancelcashOrder}
              style={{ margin: "220px auto 0px auto", borderRadius: "30px" }}
            >
              <Modal.Header className="py-2" closeButton>
                <h4 style={{ marginLeft: "20%" }}>
                  {" "}
                  Please Confirm your Order{" "}
                </h4>
              </Modal.Header>
              <Modal.Body class="my-2 text-center">
                <h4 class="mt-3 mb-2">
                  Cash On Delivery ₹ {totalPrice - discountPrice + 49}
                </h4>
                <button
                  class="btn btn-success  p-3 m-4 rounded-pill"
                  onClick={cashPay}
                >
                  Confirm Order
                </button>
                <button
                  class="btn btn-danger p-3 m-4 rounded-pill"
                  onClick={cancelcashOrder}
                >
                  Cancel Order
                </button>
              </Modal.Body>
            </Modal>

            <Modal
              id="addressAlert"
              show={addressAlert}
              onHide={cancelcashOrder}
              style={{ margin: "250px auto 0px auto" }}
            >
              <Modal.Header
                className="m-0 pl-2 py-1"
                closeButton
              ></Modal.Header>
              <Modal.Body class="my-3 text-center">
                <h5 class="mt-3 mb-2">Select Delivery Address!!</h5>
              </Modal.Body>
            </Modal>
          </Col>
        </Row>
      </>
    );
  } else {
    return <Spin />;
  }
}
export default Checkout;
