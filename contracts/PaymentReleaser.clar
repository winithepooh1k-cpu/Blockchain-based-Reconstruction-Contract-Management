(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-PROJECT-ID u101)
(define-constant ERR-INVALID-MILESTONE-ID u102)
(define-constant ERR-INVALID-AMOUNT u103)
(define-constant ERR-MILESTONE-NOT-VERIFIED u104)
(define-constant ERR-FUNDS-NOT-ESCROWED u105)
(define-constant ERR-ALREADY-RELEASED u106)
(define-constant ERR-INVALID-RECIPIENT u107)
(define-constant ERR-INVALID-TIMESTAMP u108)
(define-constant ERR-AUTHORITY-NOT-SET u109)
(define-constant ERR-INVALID-PENALTY u110)
(define-constant ERR-INVALID-INTEREST u111)
(define-constant ERR-PROJECT-NOT-ACTIVE u112)
(define-constant ERR-INVALID-STATUS u113)
(define-constant ERR-MAX-RELEASES-EXCEEDED u114)
(define-constant ERR-INVALID-CONTRACT u115)
(define-constant ERR-INVALID-SIGNATURE u116)
(define-constant ERR-INVALID-GRACE-PERIOD u117)
(define-constant ERR-INVALID-LOCATION u118)
(define-constant ERR-INVALID-CURRENCY u119)
(define-constant ERR-INVALID-FEE u120)
(define-constant ERR-INVALID-THRESHOLD u121)
(define-constant ERR-INVALID-VOTING u122)
(define-constant ERR-INVALID-UPDATE u123)
(define-constant ERR-INVALID-CREATOR u124)
(define-constant ERR-INVALID-INSPECTOR u125)

(define-data-var next-release-id uint u0)
(define-data-var max-releases uint u10000)
(define-data-var release-fee uint u500)
(define-data-var authority-contract (optional principal) none)
(define-data-var escrow-contract principal 'SP000000000000000000002Q6VF78)
(define-data-var oracle-contract principal 'SP000000000000000000002Q6VF78)
(define-data-var logger-contract principal 'SP000000000000000000002Q6VF78)

(define-map releases
  uint
  {
    project-id: uint,
    milestone-id: uint,
    amount: uint,
    recipient: principal,
    timestamp: uint,
    status: bool,
    penalty-rate: uint,
    interest-rate: uint,
    grace-period: uint,
    location: (string-utf8 100),
    currency: (string-utf8 20),
    verified: bool,
    released: bool
  }
)

(define-map releases-by-project
  uint
  (list 100 uint)
)

(define-map release-updates
  uint
  {
    update-amount: uint,
    update-recipient: principal,
    update-timestamp: uint,
    updater: principal
  }
)

(define-read-only (get-release (id uint))
  (map-get? releases id)
)

(define-read-only (get-release-updates (id uint))
  (map-get? release-updates id)
)

(define-read-only (get-releases-for-project (project-id uint))
  (map-get? releases-by-project project-id)
)

(define-private (validate-project-id (id uint))
  (if (> id u0)
      (ok true)
      (err ERR-INVALID-PROJECT-ID))
)

(define-private (validate-milestone-id (id uint))
  (if (> id u0)
      (ok true)
      (err ERR-INVALID-MILESTONE-ID))
)

(define-private (validate-amount (amount uint))
  (if (> amount u0)
      (ok true)
      (err ERR-INVALID-AMOUNT))
)

(define-private (validate-recipient (recipient principal))
  (if (not (is-eq recipient 'SP000000000000000000002Q6VF78))
      (ok true)
      (err ERR-INVALID-RECIPIENT))
)

(define-private (validate-timestamp (ts uint))
  (if (>= ts block-height)
      (ok true)
      (err ERR-INVALID-TIMESTAMP))
)

(define-private (validate-penalty-rate (rate uint))
  (if (<= rate u100)
      (ok true)
      (err ERR-INVALID-PENALTY))
)

(define-private (validate-interest-rate (rate uint))
  (if (<= rate u20)
      (ok true)
      (err ERR-INVALID-INTEREST))
)

(define-private (validate-grace-period (period uint))
  (if (<= period u30)
      (ok true)
      (err ERR-INVALID-GRACE-PERIOD))
)

(define-private (validate-location (loc (string-utf8 100)))
  (if (and (> (len loc) u0) (<= (len loc) u100))
      (ok true)
      (err ERR-INVALID-LOCATION))
)

(define-private (validate-currency (cur (string-utf8 20)))
  (if (or (is-eq cur "STX") (is-eq cur "USD") (is-eq cur "BTC"))
      (ok true)
      (err ERR-INVALID-CURRENCY))
)

(define-private (validate-status (status bool))
  (ok true)
)

(define-private (validate-fee (fee uint))
  (if (>= fee u0)
      (ok true)
      (err ERR-INVALID-FEE))
)

(define-private (validate-threshold (threshold uint))
  (if (and (> threshold u0) (<= threshold u100))
      (ok true)
      (err ERR-INVALID-THRESHOLD))
)

(define-private (validate-signature (sig (buff 65)))
  (if (is-eq (len sig) u65)
      (ok true)
      (err ERR-INVALID-SIGNATURE))
)

(define-public (set-authority-contract (contract-principal principal))
  (begin
    (try! (validate-recipient contract-principal))
    (asserts! (is-none (var-get authority-contract)) (err ERR-AUTHORITY-NOT-SET))
    (var-set authority-contract (some contract-principal))
    (ok true)
  )
)

(define-public (set-escrow-contract (contract principal))
  (begin
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-SET))
    (asserts! (is-eq tx-sender (unwrap! (var-get authority-contract) (err ERR-NOT-AUTHORIZED))) (err ERR-NOT-AUTHORIZED))
    (var-set escrow-contract contract)
    (ok true)
  )
)

(define-public (set-oracle-contract (contract principal))
  (begin
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-SET))
    (asserts! (is-eq tx-sender (unwrap! (var-get authority-contract) (err ERR-NOT-AUTHORIZED))) (err ERR-NOT-AUTHORIZED))
    (var-set oracle-contract contract)
    (ok true)
  )
)

(define-public (set-logger-contract (contract principal))
  (begin
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-SET))
    (asserts! (is-eq tx-sender (unwrap! (var-get authority-contract) (err ERR-NOT-AUTHORIZED))) (err ERR-NOT-AUTHORIZED))
    (var-set logger-contract contract)
    (ok true)
  )
)

(define-public (set-release-fee (new-fee uint))
  (begin
    (try! (validate-fee new-fee))
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-SET))
    (asserts! (is-eq tx-sender (unwrap! (var-get authority-contract) (err ERR-NOT-AUTHORIZED))) (err ERR-NOT-AUTHORIZED))
    (var-set release-fee new-fee)
    (ok true)
  )
)

(define-public (set-max-releases (new-max uint))
  (begin
    (asserts! (> new-max u0) (err ERR-INVALID_UPDATE))
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-SET))
    (asserts! (is-eq tx-sender (unwrap! (var-get authority-contract) (err ERR-NOT-AUTHORIZED))) (err ERR-NOT-AUTHORIZED))
    (var-set max-releases new-max)
    (ok true)
  )
)

(define-public (request-release
  (project-id uint)
  (milestone-id uint)
  (amount uint)
  (recipient principal)
  (penalty-rate uint)
  (interest-rate uint)
  (grace-period uint)
  (location (string-utf8 100))
  (currency (string-utf8 20))
)
  (let (
        (next-id (var-get next-release-id))
        (current-max (var-get max-releases))
        (authority (var-get authority-contract))
      )
    (asserts! (< next-id current-max) (err ERR-MAX-RELEASES-EXCEEDED))
    (try! (validate-project-id project-id))
    (try! (validate-milestone-id milestone-id))
    (try! (validate-amount amount))
    (try! (validate-recipient recipient))
    (try! (validate-penalty-rate penalty-rate))
    (try! (validate-interest-rate interest-rate))
    (try! (validate-grace-period grace-period))
    (try! (validate-location location))
    (try! (validate-currency currency))
    (asserts! (is-some authority) (err ERR-AUTHORITY-NOT-SET))
    (map-set releases next-id
      {
        project-id: project-id,
        milestone-id: milestone-id,
        amount: amount,
        recipient: recipient,
        timestamp: block-height,
        status: true,
        penalty-rate: penalty-rate,
        interest-rate: interest-rate,
        grace-period: grace-period,
        location: location,
        currency: currency,
        verified: false,
        released: false
      }
    )
    (map-set releases-by-project project-id
      (unwrap! (as-max-len? (append (default-to (list) (map-get? releases-by-project project-id)) next-id) u100) (err ERR-INVALID_UPDATE))
    )
    (var-set next-release-id (+ next-id u1))
    (print { event: "release-requested", id: next-id })
    (ok next-id)
  )
)

(define-public (verify-and-release (release-id uint) (signature (buff 65)))
  (let ((release (map-get? releases release-id)))
    (match release
      r
        (begin
          (try! (validate-signature signature))
          (asserts! (is-eq tx-sender (var-get oracle-contract)) (err ERR-NOT-AUTHORIZED))
          (asserts! (not (get verified r)) (err ERR-MILESTONE-NOT-VERIFIED))
          (asserts! (not (get released r)) (err ERR-ALREADY-RELEASED))
          (asserts! (get status r) (err ERR-INVALID-STATUS))
          (let (
            (amount (get amount r))
            (recipient (get recipient r))
            (fee (var-get release-fee))
          )
            (try! (as-contract (contract-call? .escrow-fund transfer amount tx-sender recipient)))
            (try! (stx-transfer? fee tx-sender (unwrap! (var-get authority-contract) (err ERR-AUTHORITY-NOT-SET))))
            (map-set releases release-id (merge r { verified: true, released: true, timestamp: block-height }))
            (try! (as-contract (contract-call? .audit-logger log-release release-id)))
            (print { event: "release-executed", id: release-id })
            (ok true)
          )
        )
      (err ERR-INVALID_UPDATE)
    )
  )
)

(define-public (update-release (release-id uint) (new-amount uint) (new-recipient principal))
  (let ((release (map-get? releases release-id)))
    (match release
      r
        (begin
          (asserts! (is-eq tx-sender (get recipient r)) (err ERR-NOT-AUTHORIZED))
          (try! (validate-amount new-amount))
          (try! (validate-recipient new-recipient))
          (asserts! (not (get released r)) (err ERR-ALREADY-RELEASED))
          (map-set releases release-id
            (merge r {
              amount: new-amount,
              recipient: new-recipient,
              timestamp: block-height
            })
          )
          (map-set release-updates release-id
            {
              update-amount: new-amount,
              update-recipient: new-recipient,
              update-timestamp: block-height,
              updater: tx-sender
            }
          )
          (print { event: "release-updated", id: release-id })
          (ok true)
        )
      (err ERR-INVALID_UPDATE)
    )
  )
)

(define-public (cancel-release (release-id uint))
  (let ((release (map-get? releases release-id)))
    (match release
      r
        (begin
          (asserts! (is-eq tx-sender (get recipient r)) (err ERR-NOT-AUTHORIZED))
          (asserts! (not (get released r)) (err ERR-ALREADY-RELEASED))
          (asserts! (not (get verified r)) (err ERR-MILESTONE-NOT-VERIFIED))
          (map-set releases release-id (merge r { status: false }))
          (print { event: "release-cancelled", id: release-id })
          (ok true)
        )
      (err ERR-INVALID_UPDATE)
    )
  )
)

(define-public (get-release-count)
  (ok (var-get next-release-id))
)