import React, { useState } from 'react';
import { Boxes, Plus, Trash2, Package } from 'lucide-react';
import { InventoryItem } from '../types';

interface InventoryTabProps {
  inventory: InventoryItem[];
  onAddItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  inventory,
  onAddItem,
  onDeleteItem,
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [qty, setQty] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim() || !qty) return;

    const newItem: InventoryItem = {
      id: 'P-' + Math.floor(100 + Math.random() * 900),
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      qty: parseInt(qty, 10) || 0,
    };

    onAddItem(newItem);
    setName('');
    setSku('');
    setQty('');
  };

  return (
    <div className="space-y-6">
      {/* Add Part Card */}
      <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-2xs">
        <h2 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-3 mb-4 flex items-center gap-2">
          <Boxes className="w-4 h-4 text-zinc-900" />
          <span>Add Spare Part / Inventory Item</span>
        </h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Part Name (e.g. OLED Display)"
            className="border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
          />
          <input
            type="text"
            required
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="SKU / Part No. (e.g. SCR-IP13)"
            className="border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
          />
          <input
            type="number"
            min="0"
            required
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="Stock Qty"
            className="border border-zinc-200 rounded-lg p-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium text-xs transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Add Part</span>
          </button>
        </form>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <h3 className="font-semibold text-zinc-800 text-sm flex items-center gap-2">
            <Package className="w-4 h-4 text-zinc-500" />
            <span>Parts Inventory List</span>
          </h3>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
            {inventory.length} items listed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-100">
              <tr>
                <th className="py-3 px-5">Part Name</th>
                <th className="py-3 px-5">SKU / Model</th>
                <th className="py-3 px-5">Stock Status</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-400 text-xs">
                    No inventory parts added yet.
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-medium text-zinc-800">{item.name}</td>
                    <td className="py-3.5 px-5 text-zinc-500 font-mono text-xs">{item.sku}</td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                          item.qty <= 2
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                        }`}
                      >
                        {item.qty} in stock {item.qty <= 2 && '(Low)'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="text-zinc-400 hover:text-rose-600 text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
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
