import { Icon } from "@iconify/react";
import React from "react";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { Button, Dropdown } from "flowbite-react";

const Messages = () => {
  return (
    <div className="relative group/menu px-15">
      <Dropdown
        label=""
        className="w-screen sm:w-[360px] py-6  rounded-sm"
        dismissOnClick={false}
        renderTrigger={() => (
          <div className="relative">
            <span className="relative after:absolute after:w-10 after:h-10 after:rounded-full hover:text-primary after:-top-1/2 hover:after:bg-lightprimary text-link dark:text-darklink rounded-full flex justify-center items-center cursor-pointer group-hover/menu:after:bg-lightprimary group-hover/menu:text-primary">
              <Icon icon="tabler:bell-ringing" height={20} />
            </span>
            <span className="rounded-full absolute -end-[6px] -top-[5px]  text-[10px] h-2 w-2 bg-primary flex justify-center items-center"></span>
          </div>
        )}
      >
        <div className="flex items-center  px-6 justify-between">
          <h3 className="mb-0 text-lg font-semibold text-ld">Notification</h3>
        </div>
        <SimpleBar className="max-h-80 mt-3"></SimpleBar>
        <div className="pt-5 px-6">
          <Button
            color={"primary"}
            className="w-full border border-primary text-primary hover:bg-primary hover:text-white rounded-md"
            pill
            outline
          >
            See All Notifications
          </Button>
        </div>
      </Dropdown>
    </div>
  );
};

export default Messages;
