import { ASSET, DISH_TYPES } from '../lib/shop';

// 찔 딤섬 종류 선택. 레벨 미달은 잠금 표시.
export default function DishPicker({ level, selected, onSelect, disabled }) {
  return (
    <div className="dishpicker">
      {DISH_TYPES.map((d) => {
        const locked = level < d.unlockLevel;
        return (
          <button
            key={d.id}
            className={'dishchip' + (selected === d.id ? ' sel' : '') + (locked ? ' locked' : '')}
            onClick={() => { if (!locked && !disabled) onSelect(d.id); }}
            disabled={locked || disabled}
            title={locked ? `Lv.${d.unlockLevel} 해금` : d.name}
          >
            <img src={ASSET(d.asset)} alt={d.name} draggable={false} />
            <span>{locked ? `🔒 Lv.${d.unlockLevel}` : d.name}</span>
          </button>
        );
      })}
    </div>
  );
}
