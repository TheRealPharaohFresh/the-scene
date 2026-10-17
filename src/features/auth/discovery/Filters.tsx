import { entertainmentRoles, type EntertainmentCategory } from "../../../data/entertainmentRoles";
import { usStates } from "../../../data/usStates";
import { BaseSelect } from "../../../components/ui/Select";
import type { LookingForOption } from "../../../types/profile";
import type { DiscoveryFilters } from "../../../services/publicProfiles";

type Props = {
  filters: DiscoveryFilters;
  onChange: (filters: DiscoveryFilters) => void;
};

const lookingForOptions: LookingForOption[] = ["Friends", "Networking", "Relationship"];

export default function Filters({ filters, onChange }: Props) {
  const category = filters.category ?? "";
  const roles: readonly string[] = category ? entertainmentRoles[category] : [];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(190px, 100%), 1fr))", gap: 14 }}>
      <BaseSelect
        name="filter-category"
        label="Category"
        value={category}
        onChange={(value) =>
          onChange({ ...filters, category: value as EntertainmentCategory | "", role: "" })
        }
        options={[
          { value: "", label: "Any category" },
          ...Object.keys(entertainmentRoles).map((name) => ({ value: name, label: name })),
        ]}
      />
      <BaseSelect
        name="filter-role"
        label="Role"
        value={filters.role ?? ""}
        onChange={(value) => onChange({ ...filters, role: value })}
        options={[
          { value: "", label: category ? "Any role" : "Choose a category first" },
          ...roles.map((role) => ({ value: role, label: role })),
        ]}
      />
      <BaseSelect
        name="filter-state"
        label="State"
        value={filters.stateCode ?? ""}
        onChange={(value) => onChange({ ...filters, stateCode: value })}
        options={[
          { value: "", label: "Anywhere" },
          ...usStates.map((state) => ({ value: state.isoCode, label: state.name })),
        ]}
      />
      <BaseSelect
        name="filter-looking-for"
        label="Looking for"
        value={filters.lookingFor ?? ""}
        onChange={(value) => onChange({ ...filters, lookingFor: value as LookingForOption | "" })}
        options={[
          { value: "", label: "Anything" },
          ...lookingForOptions.map((option) => ({ value: option, label: option })),
        ]}
      />
    </div>
  );
}
