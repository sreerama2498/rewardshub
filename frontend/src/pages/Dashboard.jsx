<Modal
  show={showModal}
  onHide={() =>
    setShowModal(false)
  }
  size="lg"
>
  <Modal.Header closeButton>

    <Modal.Title>
      {modalTitle}
    </Modal.Title>

  </Modal.Header>

  <Modal.Body>

    {
      modalData.length === 0 ? (

        <p>
          No records found
        </p>

      ) : (

        <table className="table">

          <thead>

            <tr>

              {
                Object.keys(
                  modalData[0]
                ).map(
                  key => (

                    <th
                      key={key}
                    >
                      {key}
                    </th>

                  )
                )
              }

            </tr>

          </thead>

          <tbody>

            {
              modalData.map(
                (
                  row,
                  index
                ) => (

                  <tr
                    key={index}
                  >

                    {
                      Object.values(
                        row
                      ).map(
                        (
                          value,
                          idx
                        ) => (

                          <td
                            key={idx}
                          >
                            {
                              String(
                                value
                              )
                            }
                          </td>

                        )
                      )
                    }

                  </tr>

                )
              )
            }

          </tbody>

        </table>

      )
    }

  </Modal.Body>

</Modal>
