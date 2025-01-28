import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import {
  Squares2X2Icon as ViewGridIcon,
  UserGroupIcon,
  SignalIcon as StatusOnlineIcon,
  ArrowTopRightOnSquareIcon as ExternalLinkIcon,
} from "@heroicons/react/24/outline";
import api from "../utils/axios";

const Sidebar = () => {
  const location = useLocation();
  const { user } = useUser();
  const [organizationId, setOrganizationId] = React.useState(null);
  const [organizationName, setOrganizationName] = React.useState("");

  React.useEffect(() => {
    const fetchOrgDetails = async () => {
      try {
        const response = await api.get(`/api/users/organization?clerkId=${user.id}`);
        const data = await response.data;
        setOrganizationId(data.organizationId);
        setOrganizationName(data.organizationName || "Status Dashboard");
      } catch (error) {
        console.error("Error fetching organization details:", error);
        setOrganizationName("Status Dashboard");
      }
    };

    if (user) {
      fetchOrgDetails();
    }
  }, [user]);

  const navigation = [
    {
      name: "Services",
      href: "/services",
      icon: ViewGridIcon,
      current: location.pathname === "/services",
    },
    {
      name: "Team",
      href: "/team",
      icon: UserGroupIcon,
      current: location.pathname === "/team",
    },
  ];

  if (organizationId) {
    navigation.push({
      name: "Public Status Page",
      href: `/status/${organizationId}`,
      icon: StatusOnlineIcon,
      current: location.pathname === `/status/${organizationId}`,
      external: true,
    });
  }

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex flex-col flex-1 min-h-0 bg-gray-800">
        <div className="flex overflow-y-auto flex-col flex-1 pt-5 pb-4">
          <div className="flex flex-shrink-0 items-center px-4">
            <h1 className="text-xl font-bold text-white">{organizationName}</h1>
          </div>
          <nav className="flex-1 px-2 mt-5 space-y-1">
            {navigation.map((item) => {
              const LinkComponent = item.external ? "a" : Link;
              const linkProps = item.external ? { target: "_blank", rel: "noopener noreferrer" } : {};

              return (
                <LinkComponent
                  key={item.name}
                  to={!item.external ? item.href : undefined}
                  href={item.external ? item.href : undefined}
                  {...linkProps}
                  className={`${
                    item.current ? "bg-gray-900 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  <item.icon
                    className={`${
                      item.current ? "text-gray-300" : "text-gray-400 group-hover:text-gray-300"
                    } mr-3 flex-shrink-0 h-6 w-6`}
                    aria-hidden="true"
                  />
                  {item.name}
                  {item.external && <ExternalLinkIcon className="ml-2 w-4 h-4 text-gray-400" aria-hidden="true" />}
                </LinkComponent>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
