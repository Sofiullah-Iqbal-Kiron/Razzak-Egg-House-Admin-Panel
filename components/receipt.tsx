import { EggLogo } from "@/components/egg-logo"
import { billTotals, lineTotal, type Bill } from "@/lib/bill"
import { formatDate, formatNumber, formatTime, toBn } from "@/lib/bn"
import { PAYMENT_METHODS } from "@/lib/products"
import { SHOP } from "@/lib/shop"

/**
 * The cash memo exactly as it is printed on 80mm thermal paper.
 * Always black on white so it prints crisply.
 */
export function Receipt({ bill }: { bill: Bill }) {
  const { items, subtotal, discount, total, paid, due } = billTotals(bill)
  const payment = PAYMENT_METHODS.find((p) => p.id === bill.payment)?.label

  return (
    <div className="receipt bg-white px-3 py-4 text-[12.5px] leading-snug font-medium text-black">
      <header className="flex flex-col items-center text-center">
        <EggLogo mono className="h-10 w-14" />
        <h1 className="mt-1 text-[22px] leading-tight font-bold">
          {SHOP.name}
        </h1>
        <p className="text-[11px] font-semibold tracking-wide">{SHOP.nameEn}</p>
        <p className="mt-0.5 text-[11.5px]">{SHOP.tagline}</p>
        {SHOP.address && <p className="text-[11.5px]">{SHOP.address}</p>}
        {SHOP.phone && (
          <p className="text-[11.5px]">মোবাইল: {toBn(SHOP.phone)}</p>
        )}
        <p className="mt-2 rounded-md bg-black px-4 py-0.5 text-[14px] font-bold text-white">
          ক্যাশ মেমো
        </p>
      </header>

      <dl className="mt-3 grid grid-cols-[auto_auto_1fr] gap-x-1.5 gap-y-0.5">
        <Meta label="বিল নং" value={toBn(bill.billNo)} />
        <Meta
          label="তারিখ"
          value={`${formatDate(bill.date)}, ${formatTime(bill.date)}`}
        />
        <Meta label="ক্রেতা" value={bill.customerName.trim() || "-"} />
        {bill.customerPhone.trim() && (
          <Meta label="মোবাইল" value={toBn(bill.customerPhone.trim())} />
        )}
      </dl>

      <Divider />

      <table className="w-full border-collapse">
        <thead>
          <tr className="text-[12px] font-bold">
            <th className="pb-1 text-left">পণ্য</th>
            <th className="pb-1 text-right">পরিমাণ</th>
            <th className="pb-1 text-right">দর</th>
            <th className="pb-1 text-right">মোট</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.key} className="border-t border-dotted border-black">
              <td className="py-1 pr-1 align-top">
                {item.name}
                <span className="block text-[10.5px]">({item.unit})</span>
              </td>
              <td className="py-1 text-right align-top">
                {formatNumber(Number(item.qty) || 0)}
              </td>
              <td className="py-1 text-right align-top">
                {formatNumber(Number(item.price) || 0)}
              </td>
              <td className="py-1 text-right align-top font-semibold">
                {formatNumber(lineTotal(item))}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={4} className="py-3 text-center">
                কোনো পণ্য যোগ করা হয়নি
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Divider />

      <dl className="grid grid-cols-[1fr_auto] gap-y-0.5">
        <Row label="মোট আইটেম" value={toBn(items.length)} />
        {discount > 0 && (
          <>
            <Row label="সর্বমোট" value={`৳ ${formatNumber(subtotal)}`} />
            <Row label="ছাড়" value={`- ৳ ${formatNumber(discount)}`} />
          </>
        )}
      </dl>
      <div className="mt-1 flex items-center justify-between border-y-2 border-black py-1 text-[17px] font-bold">
        <span>মোট টাকা</span>
        <span>৳ {formatNumber(total)}</span>
      </div>
      <dl className="mt-1 grid grid-cols-[1fr_auto] gap-y-0.5">
        {paid !== null && (
          <>
            <Row label="পরিশোধ" value={`৳ ${formatNumber(paid)}`} />
            {due > 0 && (
              <Row label="বাকি" value={`৳ ${formatNumber(due)}`} bold />
            )}
            {due < 0 && (
              <Row label="ফেরত" value={`৳ ${formatNumber(-due)}`} bold />
            )}
          </>
        )}
        <Row label="পেমেন্ট পদ্ধতি" value={payment ?? "-"} />
      </dl>

      <Divider />

      <footer className="text-center">
        <p className="text-[12px]">আমাদের সাথে থাকার জন্য</p>
        <p className="text-[16px] font-bold">ধন্যবাদ</p>
        <p className="mt-1 text-[11px]">
          {SHOP.nameEn} • {SHOP.footer}
        </p>
      </footer>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>:</dd>
      <dd className="font-semibold break-words">{value}</dd>
    </>
  )
}

function Row({
  label,
  value,
  bold,
}: {
  label: string
  value: string
  bold?: boolean
}) {
  return (
    <>
      <dt className={bold ? "font-bold" : undefined}>{label}</dt>
      <dd className={bold ? "text-right font-bold" : "text-right"}>{value}</dd>
    </>
  )
}

function Divider() {
  return <hr className="my-2 border-t border-dashed border-black" />
}
