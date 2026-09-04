import React from 'react';
import { Users, MessageSquare } from 'lucide-react';
import { RepairOrder, ShopProfile } from '../types';

interface CustomersTabProps {
  orders: RepairOrder[];
  profile: ShopProfile;
}

export const CustomersTab: React.FC<CustomersTabProps> = ({
  orders,
  profile,
}) => {
  const customerMap: { [phone: string]: { name: string; phone: string; count: number } } = {};

  orders.forEach((o) => {
    const cleanPhone = o.phone;
    if (!customerMap[cleanPhone]) {
      customerMap[cleanPhone] = { name: o.name, phone: o.phone, count: 0 };
    }
    customerMap[cleanPhone].count += 1;
  });

  const customers = Object.values(customerMap);

  const handleWhatsApp = (name: string, phone: string, count: number) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const text = `Hello ${name},

Greetings from *${profile.shopName.toUpperCase()}*! 🏥

We are reaching out regarding your service history with us (${count} repair order(s) registered).
Please feel free to reply if you need any warranty assistance, status check, or new device accessories!

Thank you for trusting ${profile.shopName}!`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs p-5">
        <div className="flex justify-between items-center border-b border-zinc-100 pb-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-900" />
              <span>Customer History Directory</span>
            </h2>
            <p className="text-xs text-zinc-500">Quickly send WhatsApp messages or review history</p>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
            {customers.length} Unique Clients
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-100">
              <tr>
                <th className="py-3 px-5">Customer Name</th>
                <th className="py-3 px-5">Phone Number</th>
                <th className="py-3 px-5">Total Repairs</th>
                <th className="py-3 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-400 text-xs">
                    No customer records found yet.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.phone} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-medium text-zinc-800">{c.name}</td>
                    <td className="py-3.5 px-5 text-zinc-500 font-mono text-xs">{c.phone}</td>
                    <td className="py-3.5 px-5">
                      <span className="font-medium text-zinc-700 px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-xs">
                        {c.count} Job{c.count > 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <button
                        onClick={() => handleWhatsApp(c.name, c.phone, c.count)}
                        className="bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer active:scale-98"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-zinc-300" />
                        <span>WhatsApp</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
