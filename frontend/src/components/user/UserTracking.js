import React, { useEffect, useState } from "react"
import { Button, Col, Container, Form, Spinner, Row, Alert, Card } from "react-bootstrap";
import { useLocation } from "react-router-dom";
// import WhatsAppAPI from "../../api/WhatsAppAPI";
import { Shimmer } from "react-shimmer";

const UserTracking = () => {

  const location = useLocation();
  const [latitude, setLatitude] = useState();
  const [longitude, setLongitude] = useState();
  const [remarks, setRemarks] = useState('');
  const [result, setResult] = useState()
  const [buttonDisabled, setButtonDisabled] = useState(false)
  const [locationRecord, setLocationRecord] = useState({});
  const [currentrecord, setCurrentrecord] = useState();
  const [spinner, setSpinner] = useState(false);
  const [alert, setAlert] = useState(null);
  const [address, setAddress] = useState('')


  useEffect(() => {
    if (alert) {
      setTimeout(() => {
        // setAlert(null);
      }, 3000)
    }
  }, [alert])

  useEffect(() => {


  }, [])

  // useEffect(() => {
  //   async function init() {
  //     let userdata = await WhatsAppAPI.getCurrentUserTrackingRec();
  //     setCurrentrecord(userdata);
  //     setLocationRecord(userdata);
  //     if (userdata.logindatetime != null && userdata.logoutdatetime == null) {
  //       setButtonDisabled(true)
  //       setRemarks(userdata.remarks)
  //     } else if (userdata.logindatetime.length && userdata.logoutdatetime.length) {
  //       setRemarks(userdata.remarks)
  //       setButtonDisabled(false)
  //     }
  //   }
  //   init();

  //   //setSpinner(true);
  //   if (!window.myMap) {
  //     window.myMap = myMap;
  //     const googleMapScript = document.createElement('script');
  //     googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBZsH0US1O6fSogoqBTUpUkvEWqs-rYMlY&callback=myMap`;
  //     googleMapScript.async = true;
  //     window.document.body.appendChild(googleMapScript);

  //   } else {

  //     myMap();
  //   }


  // }, []);


  const myMap = async () => {

    var mapProp = {
      center: new window.google.maps.LatLng(latitude ? latitude : 12, longitude ? longitude : 12),
      zoom: 14,
    };

    const locate = window.navigator && window.navigator.geolocation;
    const currentCoords = { lat: 0, lng: 0 };

    if (locate) {
      locate.getCurrentPosition((position) => {
        currentCoords.lat = position.coords.latitude;
        currentCoords.lng = position.coords.longitude;
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);

        // setSpinner(false)
        mapProp = {
          center: new window.google.maps.LatLng(position.coords.latitude, position.coords.longitude),
          zoom: 14,
        }

        var map = new window.google.maps.Map(document.getElementById("googleMap"), mapProp);
        var geocoder = new window.google.maps.Geocoder();

        geocoder.geocode({ location: currentCoords }, function (results, status) {
          let cur_address = results && results.length > 0 ? results[0].formatted_address : '';
          setAddress(cur_address);
          var marker = new window.google.maps.Marker({
            map: map,
            position: { lat: currentCoords.lat, lng: currentCoords.lng },
            title: cur_address,
            content: cur_address,
          });

          var infowindow = new window.google.maps.InfoWindow({
            content: cur_address
          });
          marker.addListener("click", () => {
            infowindow.open({
              anchor: marker,
              map,
            });
          });

        });

      }, (error) => {
      }, { maximumAge: 10000, timeout: 5000, enableHighAccuracy: true }
      )
    }



  }



  // const setLatLongJs = async (checkIn) => {
  //   const locate = window.navigator && window.navigator.geolocation;
  //   if (locate) {
  //     locate.getCurrentPosition(async (position) => {
  //       if (checkIn) {
  //         // let res = await WhatsAppAPI.createCheckInRecord({ 'logindatetime': new Date(), loginlattitude: position.coords.latitude.toString(), loginlongitude: position.coords.longitude.toString(), remarks, location: address });

  //         setTimeout(() => {

  //           if (res) {
  //             setButtonDisabled(true);
  //             setLocationRecord(res);
  //             setAlert({ message: 'You have been Successfully Checked In.', type: 'success' });
  //           } else {
  //             setAlert({ message: 'Somthing Went Wrong.', type: 'danger' });
  //           }
  //         }, '500')

  //       } else {
  //         let res;
  //         // res = await WhatsAppAPI.handlCheckOut({ ...locationRecord, 'logoutdatetime': new Date(), 'logoutlattitude': position.coords.latitude.toString(), 'logoutlongitude': position.coords.longitude.toString(), 'remarks': remarks })
  //         setTimeout(() => {
  //           setRemarks("");
  //           setAddress("");

  //           if (res) {
  //             setButtonDisabled(false);
  //             setAlert({ message: 'You have been Successfully Checked out.', type: 'danger' })
  //           } else {
  //             setAlert({ message: 'Somthing Went Wrong.', type: 'danger' })
  //           }
  //         }, '500')


  //       }
  //     }, (error) => {
  //       //console.log('error in location -> ', error) 
  //     })
  //   }
  // }

  const handleCheckIn = async () => {
    setLocationRecord({});
    // setLatLongJs(true);
  }

  const handleCheckOut = async () => {
    // setLatLongJs(false)

  }

  const handleremarkChange = (e) => {
    setRemarks(e.target.value);
  }

  const handleAddressChange = (e) => {
    setAddress(e.target.value);
  }

  const isFormValid = Boolean(remarks?.trim()) && Boolean(address?.trim());


  return (
    <>
      <Container className='mt-5'>
        <Row className='mx-5 text-center g-0'>
          <Col lg={12} xs={12} sm={12}>
            <div className='text-center p-2' style={{ height: '40px', backgroundColor: '#ffffff', borderRadius: '5px' }}>
              <span className='fw-semibold' style={{ color: '#605C68', fontSize: 'large' }}>
                Check In / Out
              </span>
            </div>
          </Col>
        </Row>
      </Container>

      <Container className='mt-1'>
        <Row className='mx-5 g-0'>
          <Col lg={12} sm={12} xs={12} className="mb-2">
            <Card className='h-100' style={{ border: "none" }}>
              <Card.Body>
                <Row className='mb-3'>
                  <Col lg={12} sm={12} xs={12}>
                    {alert && <Alert variant={alert.type} className="mb-2" onClose={() => setAlert(false)} style={{ width: '100%', padding: '15px', margin: "0px 0px 5px 0px", fontWeight: 'bold', textAlign: 'center' }}>
                      {alert.message}
                    </Alert>}
                    {spinner && <Shimmer height={500} ></Shimmer>}
                    {!spinner && <div id="googleMap" style={{ width: '100%', height: '300px', border: '1px solid black' }}>

                    </div>}
                  </Col>


                </Row>

                <Row className='mb-3'>
                  <Col lg={12} sm={12} xs={12}>
                    <Form.Group className="" style={{ padding: '0' }} controlId="formAddress">
                      <Form.Label className="form-view-label" htmlFor="formAddress">Address</Form.Label>
                      <Form.Control
                        required
                        style={{ height: "36px" }}
                        type="text"
                        name="address"
                        placeholder="Enter Address"
                        value={address}
                        onChange={handleAddressChange}
                      />

                    </Form.Group>
                  </Col>
                </Row>

                <Row className='mb-3'>
                  <Col lg={12} sm={12} xs={12}>
                    <Form.Group className="" style={{ padding: '0' }} controlId="formBasicFirstName">
                      <Form.Label
                        className="form-view-label"
                        htmlFor="formBasicFirstName"
                      >
                        Remarks
                      </Form.Label>
                      <Form.Control
                        required
                        as="textarea"
                        name="remarks"
                        value={remarks}
                        placeholder="Enter remarks.."
                        onChange={handleremarkChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className='mt-2'>
                  <Col lg={12} sm={12} xs={12}>
                    <hr></hr>
                  </Col>
                </Row>

                <Row className='g-0 mb-2'>
                  <Col lg={12} sm={12} xs={12} className="text-end mt-1">
                    <Button className='mx-2' variant="outline-secondary" disabled={!isFormValid || buttonDisabled} onClick={() => handleCheckIn()} >
                      Check-In
                    </Button>
                    <Button variant="outline-secondary" disabled={!isFormValid || !buttonDisabled} onClick={() => handleCheckOut()}>
                      Check-Out
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>

  )
}

export default UserTracking;