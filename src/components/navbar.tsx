import MobileSidebar from "./mobile-sidebar";

const Navbar = async () => {

  return (
    <div className="flex items-center p-4">
      <MobileSidebar apiLimitCount={5} isPro={true} />
      <div className="flex w-full justify-end">
        {/* <UserButton afterSignOutUrl="/" /> */}
      </div>
    </div>
  );
};

export default Navbar;
