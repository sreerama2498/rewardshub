export default function LoadingSpinner() {

  return (

    <div
      className="
        d-flex
        flex-column
        justify-content-center
        align-items-center
        mt-5
      "
    >

      <div
        className="spinner-border"
        role="status"
      >
        <span
          className="visually-hidden"
        >
          Loading...
        </span>
      </div>

      <p className="mt-3">
        Loading RewardsHub...
      </p>

    </div>

  );

}
